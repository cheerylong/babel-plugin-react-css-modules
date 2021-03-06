/**
 * @fileoverview babel-plugin-react-css-modules
 * @author yangxi | 599321378@qq.com
 */

const t = require('@babel/types')
const { getClassList } = require('./util')

// hold 住所有类型的 cssModules 转换
const optionCssModules = function (cssModules, path) {
	let classModulesExpression = null
	if (t.isIdentifier(path)) {
		// 单一变量类型
		classModulesExpression = t.memberExpression(cssModules, t.stringLiteral(path.name), true)
		const expression2 = t.logicalExpression('||', path, t.identifier('""'))
		return t.logicalExpression('||', classModulesExpression, expression2)
	} else if (t.isStringLiteral(path)) {
		// 字符串类型
		classModulesExpression = t.memberExpression(cssModules, path, true)
		return t.logicalExpression('||', classModulesExpression, path)
	}
	// 其他类型
	classModulesExpression = t.memberExpression(cssModules, path, true)
	const expression2 = t.logicalExpression('||', path, t.identifier('""'))
	return t.logicalExpression('||', classModulesExpression, expression2)
}

// 转换执行函数
const transformHandler = function (path, arguments) {
	let callExpression = t.identifier('""')
	let concatMemberExpression = t.memberExpression(callExpression, t.identifier('concat'))
	expression = t.callExpression(concatMemberExpression, arguments)
	path.replaceWith(path.parentPath.isJSXExpressionContainer() ? expression : t.jsxExpressionContainer(expression))
}

// 转换 string 格式的 className
const transformStringClassName = function (path, cssModules) {
	const classList = getClassList(path.node.value)
	let arguments = []
	classList.forEach((v, i) => {
		arguments.push(
			optionCssModules(cssModules, t.stringLiteral(v)),
			t.identifier(i === classList.length - 1 ? '""' : '" "')
		)
	})
	transformHandler(path, arguments)
}

// 转换 array 格式的 className
const transformArrayClassName = function (path, cssModules) {
	let arguments = []
	const classList = path.node.elements
	classList.forEach((v, i) => {
		if (t.isObjectExpression(v)) {
			const { properties } = v
			properties.forEach((item, index) => {
				let { key, value } = item
				if (t.isIdentifier(key)) {
					key = t.stringLiteral(key.name)
				}
				const classExpression = optionCssModules(cssModules, key)
				const conditionalExpression = t.conditionalExpression(value, classExpression, t.identifier('""'))
				arguments.push(
					conditionalExpression,
					t.identifier(i === classList.length - 1 && index === properties.length - 1 ? '""' : '" "')
				)
			})
		} else {
			// 非 json 类型
			arguments.push(
				optionCssModules(cssModules, v),
				t.identifier(i === classList.length - 1 ? '""' : '" "')
			)
		}
	})
	transformHandler(path, arguments)
}

// 转换 json 格式的 className
const transformObjectClassName = function (path, cssModules) {
	const { properties } = path.node
	let arguments = []
	properties.forEach((item, index) => {
		let { key, value } = item
		if (t.isIdentifier(key)) {
			key = t.stringLiteral(key.name)
		}
		const classExpression = optionCssModules(cssModules, key)
		const conditionalExpression = t.conditionalExpression(value, classExpression, t.identifier('""'))
		arguments.push(
			conditionalExpression,
			t.identifier(index === properties.length - 1 ? '""' : '" "')
		)
	})
	transformHandler(path, arguments)
}

module.exports = {
	transformStringClassName,
	transformArrayClassName,
	transformObjectClassName
}