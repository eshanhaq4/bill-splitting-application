import graphene
from .types import BillType, ItemType, ClaimType
from bills.models import Bill, Item, Claim

class Query(graphene.ObjectType):
    all_bills = graphene.List(BillType)
    bill_by_id = graphene.Field(BillType, id=graphene.Int(required=True))

    def resolve_all_bills(root, info):
        return Bill.objects.all().order_by('-created_at')

    def resolve_bill_by_id(root, info, id):
        try:
            return Bill.objects.get(pk=id)
        except Bill.DoesNotExist:
            return None
