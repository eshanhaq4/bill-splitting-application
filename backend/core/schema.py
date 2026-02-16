import graphene
import bills.schema.queries
import bills.schema.mutations

class Query(bills.schema.queries.Query, graphene.ObjectType):
    pass

class Mutation(bills.schema.mutations.Mutation, graphene.ObjectType):
    pass

schema = graphene.Schema(query=Query, mutation=Mutation)
