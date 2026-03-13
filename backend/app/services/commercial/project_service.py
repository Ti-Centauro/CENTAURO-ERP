from datetime import date
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from app.models import commercial as models
from app.schemas import commercial as schemas

class ProjectService:
    @staticmethod
    async def generate_tag(
        project: schemas.ProjectCreate,
        db: AsyncSession
    ) -> tuple[str, int, str]:
        """
        Generates a unique project TAG and next project number.
        Returns: (tag, next_number, client_number)

        ============================================================
        [SUSPENSA] Geração automática de TAG suspensa até fim do ano.
        A TAG agora é digitada manualmente pelo usuário.
        Para reverter, descomente o código abaixo e comente o raise.
        ============================================================
        """
        raise NotImplementedError(
            "Geração automática de TAG suspensa. "
            "A TAG deve ser informada manualmente pelo usuário."
        )

        # ============================================================
        # [CÓDIGO ORIGINAL COMENTADO — NÃO REMOVER]
        # ============================================================
        #
        # # 1. Get Client to get client_number
        # result = await db.execute(select(models.Client).where(models.Client.id == project.client_id))
        # client = result.scalar_one_or_none()
        # if not client:
        #      # Should be handled by caller properly or raise generic error
        #      raise ValueError("Client not found")
        # 
        # today = date.today()
        # ref_date = project.start_date or today
        # yy = ref_date.strftime("%y")
        # mm = ref_date.strftime("%m")
        # ccc = client.client_number if client.client_number else "00"
        #
        # tag = ""
        # next_number = 0
        #
        # if project.contract_id:
        #     # Linked Project: CEC_(...)_{Contract}_P{Seq}
        #     # Get Contract TAG
        #     result = await db.execute(select(models.Contract).where(models.Contract.id == project.contract_id))
        #     contract = result.scalar_one_or_none()
        #     if not contract:
        #          raise ValueError("Contract not found")
        #     
        #     contract_tag = contract.contract_number
        #     
        #     # Count projects for this contract
        #     result = await db.execute(select(func.count(models.Project.id)).where(models.Project.contract_id == project.contract_id))
        #     count = result.scalar() or 0
        #     next_number = count + 1
        #     
        #     tag = f"{contract_tag}_P{next_number:02d}"
        #     
        # else:
        #     # Standalone Project: CEP{CNPJ}_{YY}{MM}_{Seq}_{Client}
        #     # Determine Prefix based on Company ID (CNPJ)
        #     # 1 -> CEP1_, 2 -> CEP2_, None -> CEP_
        #     prefix_base = f"CEP{project.company_id}" if project.company_id else "CEP"
        #     
        #     # Count standalone projects for this year AND this specific prefix
        #     pattern = f"{prefix_base}_{yy}%"
        #     result = await db.execute(select(func.count(models.Project.id)).where(models.Project.tag.like(pattern)))
        #     count = result.scalar() or 0
        #     next_number = count + 1
        #     
        #     nn = f"{next_number:02d}"
        #     tag = f"{prefix_base}_{yy}{mm}_{ccc}_{nn}"
        # 
        # return tag, next_number, ccc
