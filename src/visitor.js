import React from "react";
import { always, cond, equals } from "ramda";
const ops = {
	ADD: "+",
	SUB: "-",
	MUL: "*",
	DIV: "/",
	GT: ">",
	LT: "<",
	GTE: ">=",
	LTE: "<=",
	EQ: "==",
};
let globalScope = new Map();

class Visitor extends React.Component {
	constructor(value) {
		super(value);
		this.value = value;
	}
	visitVariableDeclaration(node) {
		const nodeKind = node.kind;
		return this.visitNodes(node.declarations, nodeKind);
	}
	visitVariableDeclarator(node, nodeKind) {
		const id = node.id && node.id.name;
		const init = this.visitNode(node.init);
		if (nodeKind === "let" || nodeKind === "const") {
			if (globalScope.has(id)) {
				this.value = `Uncaught SyntaxError: Identifier '${id}' has already been declared`;
			} else {
				globalScope.set(id, init);
			}
		} else {
			globalScope.set(id, init);
		}

		return init;
	}
	visitIdentifier(node) {
		const name = node.name;
		return globalScope.get(name)
			? globalScope.get(name)
			: (this.value = `Uncaught ReferenceError: '${name}' is not defined `);
	}
	visitLiteral(node) {
		return node.raw;
	}

	visitBinaryExpression(node) {
		const leftNode = isNaN(this.visitNode(node.left))
			? this.visitNode(node.left)
			: +this.visitNode(node.left);
		const operator = node.operator;
		const rightNode = isNaN(this.visitNode(node.right))
			? this.visitNode(node.right)
			: +this.visitNode(node.right);
		const result = cond([
			[equals(ops.ADD), always(leftNode + rightNode)],
			[equals(ops.SUB), always(leftNode - rightNode)],
			[equals(ops.DIV), always(leftNode / rightNode)],
			[equals(ops.MUL), always(leftNode * rightNode)],
			[equals(ops.GT), always(leftNode > rightNode)],
			[equals(ops.LT), always(leftNode < rightNode)],
			[equals(ops.GTE), always(leftNode >= rightNode)],
			[equals(ops.LTE), always(leftNode >= rightNode)],
			[equals(ops.EQ), always(leftNode === rightNode)],
		]);
		return result(operator);
	}

	evalArgs(nodeArgs) {
		let g = [];
		for (const nodeArg of nodeArgs) {
			g.push(this.visitNode(nodeArg));
		}
		return g;
	}
	visitCallExpression(node) {
		// const callee = this.visitIdentifier(node.callee || node);
		const _arguments = this.evalArgs(node.arguments);
		this.value = _arguments;
	}
	visitNodes(nodes, nodeKind = "") {
		for (const node of nodes) {
			this.visitNode(node, nodeKind);
		}
	}
	visitExpressionStatement(node) {
		return this.visitCallExpression(node.expression);
	}
	visitNode(node, nodeKind = "") {
		switch (node.type) {
			case "VariableDeclaration":
				return this.visitVariableDeclaration(node);
			case "VariableDeclarator":
				return this.visitVariableDeclarator(node, nodeKind);
			case "Literal":
				return this.visitLiteral(node);
			case "Identifier":
				return this.visitIdentifier(node);
			case "BinaryExpression":
				return this.visitBinaryExpression(node);
			case "CallExpression":
				return this.visitCallExpression(node);
			case "ExpressionStatement":
				return this.visitExpressionStatement(node);
			default:
				return null;
		}
	}
	run(nodes) {
		return this.visitNodes(nodes);
	}
}
export default Visitor;
