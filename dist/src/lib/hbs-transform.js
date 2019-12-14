"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("./utils");
function serializeKey(key) {
    return key.split(" - ")[0];
}
function keyForItem(item) {
    return `${positionForItem(item)} - ${item.type}`;
}
exports.keyForItem = keyForItem;
function positionForItem(item) {
    const { start, end } = item.loc;
    return `${start.line},${start.column}:${end.line},${end.column}`;
}
exports.positionForItem = positionForItem;
function normalizePathOriginal(node) {
    if (node.data === true) {
        return `this.args.${node.original
            .replace(utils_1.PLACEHOLDER, "")
            .replace("@", "")}`;
    }
    else if (node.this === true) {
        return `${node.original.replace(utils_1.PLACEHOLDER, "")}`;
    }
    else {
        return node.original;
    }
}
function transformPathExpression(node, key, { getItemScopes, tailForGlobalScope, pathsForGlobalScope, importNameForItem, componentImport, addImport, addComponentImport, getPathScopes, yields, componentsForImport, globalScope, blockPaths, globalRegistry }) {
    let result = "";
    if (node.data === true) {
        result = exports.transform.wrapToFunction(normalizePathOriginal(node), key);
    }
    else if (node.this === true) {
        result = exports.transform.fn(componentImport ? "" : "this: null", normalizePathOriginal(node), key);
    }
    else {
        const { foundKey, scopeKey, scopeChain } = getPathScopes(node, key);
        if (foundKey === "globalScope") {
            if (!(scopeKey in globalScope)) {
                if (blockPaths.includes(key)) {
                    globalScope[scopeKey] = "AbstractBlockHelper";
                    if (scopeKey in globalRegistry &&
                        componentsForImport.includes(scopeKey)) {
                        addComponentImport(scopeKey, globalRegistry[scopeKey]);
                    }
                }
                else {
                    if (scopeKey in globalRegistry) {
                        addImport(scopeKey, globalRegistry[scopeKey]);
                        globalScope[scopeKey] = importNameForItem(scopeKey);
                    }
                    else {
                        globalScope[scopeKey] = "AbstractHelper";
                    }
                }
            }
            if (pathsForGlobalScope[scopeKey]) {
                result = exports.transform.fn(pathsForGlobalScope[scopeKey], `this.globalScope["${scopeKey}"]${tailForGlobalScope[scopeKey]
                    ? tailForGlobalScope[scopeKey]
                    : "(params, hash)"}`, key);
                if (scopeKey === "yield") {
                    const scopes = getItemScopes(key);
                    const slosestScope = scopes[0];
                    if (!slosestScope) {
                        console.log("unable to find scope for " + key);
                    }
                    else {
                        yields.push(slosestScope[0]);
                    }
                }
            }
            else {
                if (scopeKey in globalRegistry &&
                    componentsForImport.includes(scopeKey)) {
                    result = exports.transform.fn("_?, hash?", `let klass = new ${importNameForItem(scopeKey)}(); klass.args = hash; return klass.defaultYield()`, key);
                }
                else {
                    result = exports.transform.fn("params?, hash?", `this.globalScope["${scopeKey}"](params, hash)`, key);
                }
            }
        }
        else {
            if (scopeChain.length) {
                result = exports.transform.fn("", `this["${foundKey[0]}"]()[${foundKey[1]}].${scopeChain.join(".")}`, key);
            }
            else {
                result = exports.transform.fn("", `this["${foundKey[0]}"]()[${foundKey[1]}]`, key);
            }
        }
    }
    return result;
}
exports.transformPathExpression = transformPathExpression;
exports.transform = {
    support(node) {
        return node.type in this;
    },
    transform(node, key) {
        return this._wrap(this[node.type](node), key);
    },
    wrapToFunction(str, key) {
        return this._wrap(str, key);
    },
    addMark(key) {
        return `/*@path-mark ${serializeKey(key)}*/`;
    },
    _wrap(str, key) {
        return `() { return ${str}; ${this.addMark(key)}}`;
    },
    fn(args, body, key) {
        return this._makeFn(args, body, key);
    },
    _makeFn(rawArgs, rawBody, key) {
        let body = `return ${rawBody}`;
        if (rawBody.includes("return ")) {
            body = rawBody;
        }
        let args = `(${rawArgs})`;
        if (rawArgs.includes("(") && rawArgs.includes(")")) {
            args = rawArgs;
        }
        return `${args} { ${body}; ${this.addMark(key)}}`;
    },
    TextNode(node) {
        return `"${node.chars}"`;
    },
    hashedExp(node) {
        let result = "";
        const params = node.params
            .map(p => {
            return `this["${keyForItem(p)}"]()`;
        })
            .join(",");
        const hash = node.hash.pairs
            .map(p => {
            return `${p.key}:this["${keyForItem(p.value)}"]()`;
        })
            .join(",");
        if (hash.length && params.length) {
            result = `this["${keyForItem(node.path)}"]([${params}],{${hash}})`;
        }
        else if (!hash.length && params.length) {
            result = `this["${keyForItem(node.path)}"]([${params}])`;
        }
        else if (hash.length && !params.length) {
            result = `this["${keyForItem(node.path)}"]([],{${hash}})`;
        }
        else {
            result = `this["${keyForItem(node.path)}"]()`;
        }
        return result;
    },
    SubExpression(node) {
        return this.hashedExp(node);
    },
    MustacheStatement(node) {
        return this.hashedExp(node);
    },
    ElementModifierStatement(node) {
        return this.hashedExp(node);
    },
    BlockStatement(node) {
        return this.hashedExp(node);
    },
    NumberLiteral(node) {
        return `${node.value}`;
    },
    StringLiteral(node) {
        return `"${node.value}"`;
    },
    NullLiteral() {
        return "null";
    },
    BooleanLiteral(node) {
        return `${node.value === true ? "true" : "false"}`;
    },
    UndefinedLiteral() {
        return "undefined";
    }
};
//# sourceMappingURL=hbs-transform.js.map