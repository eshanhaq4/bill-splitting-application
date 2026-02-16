import graphene
from .types import BillType, ItemType, ClaimType
from bills.models import Bill, Item, Claim
from django.contrib.auth.models import User

class CreateBill(graphene.Mutation):
    bill = graphene.Field(BillType)

    class Arguments:
        name = graphene.String(required=True)
        total_amount = graphene.Decimal(required=False)

    def mutate(self, info, name, total_amount=0.00):
        if user.is_anonymous:
             user = User.objects.first()
             if not user:
                 user = User.objects.create_user(username='testuser', password='password')

        bill = Bill(name=name, total_amount=total_amount, created_by=user)
        bill.save()
        return CreateBill(bill=bill)

class AddItem(graphene.Mutation):
    item = graphene.Field(ItemType)

    class Arguments:
        bill_id = graphene.Int(required=True)
        name = graphene.String(required=True)
        price = graphene.Decimal(required=True)
        quantity = graphene.Int(required=True)

    def mutate(self, info, bill_id, name, price, quantity):
        try:
            bill = Bill.objects.get(pk=bill_id)
        except Bill.DoesNotExist:
            raise Exception("Bill not found")

        item = Item(bill=bill, name=name, price=price, quantity=quantity)
        item.save()
        return AddItem(item=item)

class ClaimItem(graphene.Mutation):
    claim = graphene.Field(ClaimType)

    class Arguments:
        item_id = graphene.Int(required=True)
        percentage = graphene.Decimal(required=False, default_value=100.00)

    def mutate(self, info, item_id, percentage):
        user = info.context.user
        if user.is_anonymous:
             user = User.objects.first() 
             if not user:
                 raise Exception("No user found for claim")

        try:
            item = Item.objects.get(pk=item_id)
        except Item.DoesNotExist:
            raise Exception("Item not found")

        claim = Claim(item=item, user=user, percentage=percentage)
        claim.save()
        return ClaimItem(claim=claim)

class Mutation(graphene.ObjectType):
    create_bill = CreateBill.Field()
    add_item = AddItem.Field()
    claim_item = ClaimItem.Field()
