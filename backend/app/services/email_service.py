from typing import List, Dict
from datetime import datetime

def generate_daily_briefing_html(tasks: List[Dict]) -> str:
    """
    Generates a simple HTML email body for the daily task briefing.
    Expected tasks format: {
        "id": int,
        "title": str,
        "due_date": datetime,
        "proposal_title": str,
        "client_name": str,
        "is_overdue": bool
    }
    """
    if not tasks:
        return "<p>Não há tarefas pendentes para hoje.</p>"

    today_str = datetime.now().strftime("%d/%m/%Y")
    
    html = f"""
    <html>
    <head>
        <style>
            body {{ font-family: Arial, sans-serif; color: #333; }}
            table {{ width: 100%; border-collapse: collapse; margin-top: 20px; }}
            th, td {{ padding: 10px; border: 1px solid #ddd; text-align: left; }}
            th {{ background-color: #f4f4f4; }}
            .overdue {{ color: #dc2626; font-weight: bold; }}
            .today {{ color: #16a34a; font-weight: bold; }}
            .header {{ background-color: #1e293b; color: white; padding: 20px; text-align: center; }}
        </style>
    </head>
    <body>
        <div class="header">
            <h2>Resumo Diário - CRM</h2>
            <p>{today_str}</p>
        </div>
        
        <p>Olá,</p>
        <p>Aqui estão suas ações pendentes e para hoje:</p>

        <table>
            <thead>
                <tr>
                    <th>Status</th>
                    <th>Tarefa</th>
                    <th>Cliente / Proposta</th>
                    <th>Vencimento</th>
                </tr>
            </thead>
            <tbody>
    """

    for task in tasks:
        is_overdue = task.get("is_overdue", False)
        status_class = "overdue" if is_overdue else "today"
        status_text = "ATRASADO" if is_overdue else "HOJE"
        
        date_str = task["due_date"].strftime("%d/%m") if isinstance(task["due_date"], datetime) else str(task["due_date"])[:10]
        
        row = f"""
                <tr>
                    <td class="{status_class}">{status_text}</td>
                    <td>{task['title']}</td>
                    <td>
                        <strong>{task['client_name']}</strong><br/>
                        <span style="font-size: 0.85em; color: #666;">{task['proposal_title']}</span>
                    </td>
                    <td>{date_str}</td>
                </tr>
        """
        html += row

    html += """
            </tbody>
        </table>
        
        <p style="margin-top: 30px; font-size: 0.9em; color: #666;">
            Acesse o <a href="https://erp.centaurotelecom.com.br">ERP Centauro</a> para completar estas tarefas.
        </p>
    </body>
    </html>
    """
    
    return html
