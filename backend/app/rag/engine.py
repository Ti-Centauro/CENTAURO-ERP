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
        # Debug: Print loaded API key status
        self.api_key = os.getenv("GOOGLE_API_KEY")
        if not self.api_key:
            print("❌ RAG Engine: GOOGLE_API_KEY lookup failed. Checking .env file...")
            from dotenv import find_dotenv
            print(f"RAG Engine: .env found at: {find_dotenv()}")
            load_dotenv(override=True) 
            self.api_key = os.getenv("GOOGLE_API_KEY")
            
        if self.api_key:
            masked_key = self.api_key[:4] + "..." + self.api_key[-4:] if len(self.api_key) > 8 else "****"
            print(f"✅ RAG Engine: API Key loaded successfully: {masked_key}")
        else:
            print("❌ RAG Engine: CRITICAL - GOOGLE_API_KEY is still missing after reload.")
            self.chain = None
            return

        # Initialize LLM
        # Note: gemini-2.5-flash quota exceeded (Limit 20). 
        # Switching to gemini-1.5-flash which has higher limits.
        self.llm = ChatGoogleGenerativeAI(
            model="gemini-2.5-flash", 
            google_api_key=self.api_key,
            temperature=0
        )
        
        # Initialize Database
        # We use standard sqlite driver for synchronous operations in LangChain
        db_path = "sqlite:///./centauro.db"
        self.db = SQLDatabase.from_uri(db_path)
        print(f"✅ RAG Engine: Connected to database at {db_path}")

        # Create SQL Chain (Manual Approach)
        
        # 1. Generate SQL
        # Using a custom prompt instead of create_sql_query_chain
        from langchain_core.prompts import PromptTemplate
        
        sql_prompt = PromptTemplate.from_template(
            """You are a SQLite expert. Given an input question, create a syntactically correct SQLite query to run.
            Unless the user specifies otherwise, obtain 5 results.
            Never query for all columns from a specific table, only ask for a the few relevant columns given the question.
            Pay attention to use only the column names you can see in the schema description. 
            Be careful to not query for columns that do not exist. 
            Pay attention to which column is in which table.

            IMPORTANT: The 'salary' column in 'collaborators' is a STRING (e.g., 'R$ 2.500,00'). 
            To sort by salary, you might need to try casting or just note that it is text.
            Ideally, use CAST(REPLACE(REPLACE(REPLACE(salary, 'R$ ', ''), '.', ''), ',', '.') AS FLOAT) if possible, 
            or just select the column and let the user judge.

            The database schema is as follows:
            {schema}

            Question: {question}
            SQL Query:"""
        )
        
        def get_schema(_):
            return self.db.get_table_info()

        generate_query = (
            RunnablePassthrough.assign(schema=get_schema)
            | sql_prompt
            | self.llm
            | StrOutputParser()
        )
        
        # 2. Execute SQL
        pass_query = RunnablePassthrough.assign(query=generate_query)
        execute_query = QuerySQLDataBaseTool(db=self.db)
        
        # 3. Answer Question
        answer_prompt = ChatPromptTemplate.from_template(
            """Given the following user question, corresponding SQL query, and SQL result, answer the user question.
            
            If the SQL Result contains an error message (starting with "Error"), YOU MUST report that technical error to the user so they can fix it.
            Do not just say "I can't answer". Say "I encountered a database error: [Error Message]".

            Question: {question}
            SQL Query: {query}
            SQL Result: {result}
            
            Answer: """
        )
        
        # Combine into full chain
        # We need to clean the generated SQL (sometimes LLM adds ```sql ... ```)
        def clean_sql(text):
            # Remove markdown code blocks
            cleaned = text.replace("```sqlite", "").replace("```sql", "").replace("```", "").strip()
            
            # Sometimes the LLM puts "sqlite" at the start without backticks if prompted poorly?
            if cleaned.lower().startswith("sqlite"):
                cleaned = cleaned[6:].strip()
                
            print(f"🕵️ Generated SQL: {cleaned}")
            return cleaned

        def execute_and_log(query):
            try:
                result = execute_query.invoke(query)
                print(f"🕵️ SQL Result: {result}")
                return result
            except Exception as e:
                print(f"❌ SQL Execution Error: {e}")
                return f"Error executing SQL: {e}"

        self.chain = (
            pass_query.assign(
                # Run query on the result of generate_query (cleaned)
                result=lambda x: execute_and_log(clean_sql(x["query"]))
            )
            | answer_prompt
            | self.llm
            | StrOutputParser()
        )

    def chat(self, message: str):
        if not self.chain:
            return "Erro: Agente não inicializado corretamente (Verifique API Key)."
            
        try:
            # The chain expects 'question' input
            response = self.chain.invoke({"question": message})
            return response
        except Exception as e:
            print(f"❌ RAG Error: {e}")
            return f"Erro ao processar sua solicitação: {str(e)}"

    # Removed duplicate chat method

# Singleton instance
try:
    rag_engine = RAGEngine()
except Exception as e:
    print(f"❌ CRITICAL RAG ENGINE ERROR: {e}")
    # Create a dummy engine that just reports the error
    class DummyEngine:
        def chat(self, msg): return "Ocorreu um erro ao inicializar o agente de IA. Verifique os logs do servidor."
    rag_engine = DummyEngine()
