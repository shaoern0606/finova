from data import GOALS, LOAN_ACCOUNT, USER


class FinanceGraph:
    def __init__(self):
        self.nodes = {}
        self.relationships = []

    def add_node(self, node_type, node_id, properties):
        self.nodes[node_id] = {"id": node_id, "type": node_type, **properties}

    def relate(self, from_id, relation, to_id):
        self.relationships.append({"from": from_id, "type": relation, "to": to_id})

    def neighbors(self, node_id, relation=None):
        ids = [
            item["to"]
            for item in self.relationships
            if item["from"] == node_id and (relation is None or item["type"] == relation)
        ]
        return [self.nodes[item] for item in ids if item in self.nodes]

    def as_dict(self):
        return {"nodes": list(self.nodes.values()), "relationships": self.relationships}


def build_graph(expenses):
    graph = FinanceGraph()
    graph.add_node("User", USER["id"], USER)

    for category, amount in expenses.items():
        expense_id = f"expense_{category.lower()}"
        graph.add_node("Expense", expense_id, {"category": category, "monthly_amount": round(amount, 2)})
        graph.relate(USER["id"], "HAS_EXPENSE", expense_id)

    for goal in GOALS:
        graph.add_node("Goal", goal["id"], goal)
        graph.relate(USER["id"], "HAS_GOAL", goal["id"])

    for loan in LOAN_ACCOUNT["loans"]:
        graph.add_node("Loan", loan["id"], loan)
        graph.relate(USER["id"], "HAS_LOAN", loan["id"])

    return graph

