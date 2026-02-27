import os
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langchain_core.runnables import RunnablePassthrough
from dotenv import load_dotenv

load_dotenv()

from langchain_community.utilities import SQLDatabase
# from langchain.chains import create_sql_query_chain # Removed due to import error
from langchain_community.tools.sql_database.tool import QuerySQLDataBaseTool
from operator import itemgetter

class RAGEngine:
    def __init__(self):
        self._load_api_key()
        # If API key is critically missing, prevent further initialization
        if not self.api_key:
            self.llm = None
            self.db = None
            self.chain = None
            return

        self.llm = self._setup_llm()
        self.db = self._connect_db()
        self.chain = self._build_sql_chain()

    def _load_api_key(self):
        api_key = os.getenv("GOOGLE_API_KEY")
        if not api_key:
            print("❌ RAG Engine: GOOGLE_API_KEY lookup failed. Checking .env file...")
            from dotenv import find_dotenv
            print(f"RAG Engine: .env found at: {find_dotenv()}")
            load_dotenv(override=True)
            api_key = os.getenv("GOOGLE_API_KEY")
        
        self.api_key = api_key
        if self.api_key:
            masked = self.api_key[:4] + "..." + self.api_key[-4:] if len(self.api_key) > 8 else "****"
            print(f"✅ RAG Engine: API Key loaded successfully: {masked}")
        else:
            print("❌ RAG Engine: CRITICAL - GOOGLE_API_KEY is still missing after reload.")

    def _setup_llm(self):
        # Using gemini-2.5-flash as verified available model
        return ChatGoogleGenerativeAI(
            model="gemini-2.5-flash",
            google_api_key=self.api_key,
            temperature=0
        )

    def _connect_db(self):
        # 1. Start with the same logic as database.py to get Railway URL
        database_url = os.environ.get("DATABASE_URL", "sqlite:///./centauro.db")
        
        # 2. Enforce explicit SYNCHRONOUS psycopg2 driver for Langchain
        # Langchain's SQLDatabase does not support asyncpg
        if database_url.startswith("postgres://"):
            database_url = database_url.replace("postgres://", "postgresql+psycopg2://", 1)
        elif database_url.startswith("postgresql://") and not database_url.startswith("postgresql+psycopg2://"):
            database_url = database_url.replace("postgresql://", "postgresql+psycopg2://", 1)
        elif database_url.startswith("postgresql+asyncpg://"):
            database_url = database_url.replace("postgresql+asyncpg://", "postgresql+psycopg2://", 1)
            
        print(f"✅ RAG Engine: Connected to database at {database_url}")
        
        # 3. Security: Restrict allowed tables so the LLM cannot see passwords or internal systems
        allowed_tables = [
            "clients", "contracts", "projects", "project_billings",
            "collaborators", "teams", "project_collaborators",
            "tools", "project_tools", "fleet", "project_vehicles", 
            "tickets", "purchase_requests"
        ]
        
        return SQLDatabase.from_uri(database_url, include_tables=allowed_tables)

    def _build_sql_chain(self):
        """
        Builds the Text-to-SQL chain manually effectively replicating
        'create_sql_query_chain' which is missing in this environment.
        """
        # 1. Prompt to generate SQL
        from langchain_core.prompts import PromptTemplate
        sql_prompt = PromptTemplate.from_template(
            """You are a PostgreSQL expert. Generate a precise SQL query for the question.
            Unless the user specifies otherwise, obtain 5 results.
            Never query for all columns from a specific table, only ask for a the few relevant columns given the question.
            Pay attention to use only the column names you can see in the schema description. 
            Be careful to not query for columns that do not exist. 
            Pay attention to which column is in which table.
            
            SECURITY RULES - CRITICAL:
            1. You have READ-ONLY access. 
            2. You MUST NEVER generate or execute INSERT, UPDATE, DELETE, DROP, or ALTER commands.
            3. Generate ONLY SELECT statements.

            IMPORTANT: The 'salary' column in 'collaborators' is a STRING (e.g., 'R$ 2.500,00'). 
            To sort by salary, you might need to try casting or just note that it is text.
            Ideally, use CAST(REPLACE(REPLACE(REPLACE(salary, 'R$ ', ''), '.', ''), ',', '.') AS FLOAT) if possible, 
            or just select the column and let the user judge.

            The database schema is as follows:
            {schema}

            Question: {question}
            SQL Query:"""
        )

        # 2. SQL Cleaner (Handles Markdown artifacts)
        def clean_sql(text):
            cleaned = text.replace("```postgresql", "").replace("```postgres", "").replace("```sql", "").replace("```sqlite", "").replace("```", "").strip()
            if cleaned.lower().startswith("postgresql"):
                cleaned = cleaned[10:].strip()
            elif cleaned.lower().startswith("postgres"):
                cleaned = cleaned[8:].strip()
            elif cleaned.lower().startswith("sql"):
                cleaned = cleaned[3:].strip()
            print(f"🕵️ Generated SQL: {cleaned}")
            return cleaned

        # 3. Safe Executor
        execute_tool = QuerySQLDataBaseTool(db=self.db)
        def safe_execute(query):
            try:
                result = execute_tool.invoke(query)
                print(f"🕵️ SQL Result: {result}")
                return result
            except Exception as e:
                print(f"❌ SQL Execution Error: {e}")
                return f"Error executing SQL: {e}"

        # 4. Final Answer Prompt
        answer_prompt = ChatPromptTemplate.from_template(
            """Given the following user question, corresponding SQL query, and SQL result, answer the user question.
            
            If the SQL Result contains an error message (starting with "Error"), YOU MUST report that technical error to the user so they can fix it.
            Do not just say "I can't answer". Say "I encountered a database error: [Error Message]".

            Question: {question}
            SQL Query: {query}
            SQL Result: {result}
            
            Answer: """
        )

        # Chain Assembly
        generate_query = (
            RunnablePassthrough.assign(schema=lambda _: self.db.get_table_info())
            | sql_prompt
            | self.llm
            | StrOutputParser()
        )

        return (
            RunnablePassthrough.assign(query=generate_query)
            .assign(result=lambda x: safe_execute(clean_sql(x["query"])))
            | answer_prompt
            | self.llm
            | StrOutputParser()
        )

    def chat(self, message: str):
        if not self.chain:
            return "Erro: Agente não inicializado corretamente (Verifique API Key)."
            
        try:
            return self.chain.invoke({"question": message})
        except Exception as e:
            print(f"❌ RAG Error: {e}")
            return f"Erro ao processar sua solicitação: {str(e)}"

# Singleton instance
try:
    rag_engine = RAGEngine()
except Exception as e:
    print(f"❌ CRITICAL RAG ENGINE ERROR: {e}")
    # Create a dummy engine that just reports the error
    class DummyEngine:
        def chat(self, msg): return "Ocorreu um erro ao inicializar o agente de IA. Verifique os logs do servidor."
    rag_engine = DummyEngine()
