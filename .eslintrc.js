module.exports = {
	extends: ["plugin:@typescript-eslint/recommended-type-checked"],
	parser: "@typescript-eslint/parser",
	parserOptions: {
		project: "tsconfig.json",
		sourceType: "module",
	},
	plugins: ["eslint-plugin-jsdoc", "@typescript-eslint"],
	root: true,
	rules: {
		"jsdoc/check-alignment": "error",
		"jsdoc/check-indentation": "error",
		"jsdoc/tag-lines": "error",
		"@typescript-eslint/no-misused-promises": [
			"error",
			{
				checksVoidReturn: false,
			},
		],
	},
};
