import graphene
from graphene_django import DjangoObjectType
from bills.models import Bill, Item, Claim

class BillType(DjangoObjectType):
    class Meta:
        model = Bill
        fields = "__all__"

class ItemType(DjangoObjectType):
    class Meta:
        model = Item
        fields = "__all__"

class ClaimType(DjangoObjectType):
    class Meta:
        model = Claim
        fields = "__all__"
