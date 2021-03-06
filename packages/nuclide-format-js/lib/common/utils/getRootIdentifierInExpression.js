'use strict';

var _jscodeshift;

function _load_jscodeshift() {
  return _jscodeshift = _interopRequireDefault(require('./jscodeshift'));
}

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/*
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 *
 * 
 */

var match = (_jscodeshift || _load_jscodeshift()).default.match;

/**
 * This traverses a node to find the first identifier in nested expressions,
 * returning its name and parent node (if applicable).
 */


function getRootIdentifierInExpression(node, parent) {
  if (!node) {
    return null;
  }
  if (match(node, { type: 'ExpressionStatement' })) {
    return getRootIdentifierInExpression(node.expression, node);
  }
  if (match(node, { type: 'CallExpression' })) {
    return getRootIdentifierInExpression(node.callee, node);
  }
  if (match(node, { type: 'MemberExpression' })) {
    return getRootIdentifierInExpression(node.object, node);
  }
  if (match(node, { type: 'Identifier' })) {
    return { name: node.name, parent: parent };
  }
  return null;
}

module.exports = getRootIdentifierInExpression;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9jb21tb24vdXRpbHMvZ2V0Um9vdElkZW50aWZpZXJJbkV4cHJlc3Npb24uanMiXSwibmFtZXMiOlsibWF0Y2giLCJnZXRSb290SWRlbnRpZmllckluRXhwcmVzc2lvbiIsIm5vZGUiLCJwYXJlbnQiLCJ0eXBlIiwiZXhwcmVzc2lvbiIsImNhbGxlZSIsIm9iamVjdCIsIm5hbWUiLCJtb2R1bGUiLCJleHBvcnRzIl0sIm1hcHBpbmdzIjoiOzs7O0FBWUE7QUFBQTtBQUFBOzs7O0FBWkE7Ozs7Ozs7Ozs7SUFjT0EsSyxpREFBQUEsSzs7QUFFUDs7Ozs7O0FBSUEsU0FBU0MsNkJBQVQsQ0FDRUMsSUFERixFQUVFQyxNQUZGLEVBR2tDO0FBQ2hDLE1BQUksQ0FBQ0QsSUFBTCxFQUFXO0FBQ1QsV0FBTyxJQUFQO0FBQ0Q7QUFDRCxNQUFJRixNQUFNRSxJQUFOLEVBQVksRUFBQ0UsTUFBTSxxQkFBUCxFQUFaLENBQUosRUFBZ0Q7QUFDOUMsV0FBT0gsOEJBQThCQyxLQUFLRyxVQUFuQyxFQUErQ0gsSUFBL0MsQ0FBUDtBQUNEO0FBQ0QsTUFBSUYsTUFBTUUsSUFBTixFQUFZLEVBQUNFLE1BQU0sZ0JBQVAsRUFBWixDQUFKLEVBQTJDO0FBQ3pDLFdBQU9ILDhCQUE4QkMsS0FBS0ksTUFBbkMsRUFBMkNKLElBQTNDLENBQVA7QUFDRDtBQUNELE1BQUlGLE1BQU1FLElBQU4sRUFBWSxFQUFDRSxNQUFNLGtCQUFQLEVBQVosQ0FBSixFQUE2QztBQUMzQyxXQUFPSCw4QkFBOEJDLEtBQUtLLE1BQW5DLEVBQTJDTCxJQUEzQyxDQUFQO0FBQ0Q7QUFDRCxNQUFJRixNQUFNRSxJQUFOLEVBQVksRUFBQ0UsTUFBTSxZQUFQLEVBQVosQ0FBSixFQUF1QztBQUNyQyxXQUFPLEVBQUNJLE1BQU1OLEtBQUtNLElBQVosRUFBa0JMLGNBQWxCLEVBQVA7QUFDRDtBQUNELFNBQU8sSUFBUDtBQUNEOztBQUVETSxPQUFPQyxPQUFQLEdBQWlCVCw2QkFBakIiLCJmaWxlIjoiZ2V0Um9vdElkZW50aWZpZXJJbkV4cHJlc3Npb24uanMiLCJzb3VyY2VzQ29udGVudCI6WyIvKlxuICogQ29weXJpZ2h0IChjKSAyMDE1LXByZXNlbnQsIEZhY2Vib29rLCBJbmMuXG4gKiBBbGwgcmlnaHRzIHJlc2VydmVkLlxuICpcbiAqIFRoaXMgc291cmNlIGNvZGUgaXMgbGljZW5zZWQgdW5kZXIgdGhlIGxpY2Vuc2UgZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBpblxuICogdGhlIHJvb3QgZGlyZWN0b3J5IG9mIHRoaXMgc291cmNlIHRyZWUuXG4gKlxuICogQGZsb3dcbiAqL1xuXG5pbXBvcnQgdHlwZSB7Tm9kZX0gZnJvbSAnLi4vdHlwZXMvYXN0JztcblxuaW1wb3J0IGpzY3MgZnJvbSAnLi9qc2NvZGVzaGlmdCc7XG5cbmNvbnN0IHttYXRjaH0gPSBqc2NzO1xuXG4vKipcbiAqIFRoaXMgdHJhdmVyc2VzIGEgbm9kZSB0byBmaW5kIHRoZSBmaXJzdCBpZGVudGlmaWVyIGluIG5lc3RlZCBleHByZXNzaW9ucyxcbiAqIHJldHVybmluZyBpdHMgbmFtZSBhbmQgcGFyZW50IG5vZGUgKGlmIGFwcGxpY2FibGUpLlxuICovXG5mdW5jdGlvbiBnZXRSb290SWRlbnRpZmllckluRXhwcmVzc2lvbihcbiAgbm9kZTogP05vZGUsXG4gIHBhcmVudD86IE5vZGUsXG4pOiA/e25hbWU6IHN0cmluZywgcGFyZW50OiA/Tm9kZX0ge1xuICBpZiAoIW5vZGUpIHtcbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuICBpZiAobWF0Y2gobm9kZSwge3R5cGU6ICdFeHByZXNzaW9uU3RhdGVtZW50J30pKSB7XG4gICAgcmV0dXJuIGdldFJvb3RJZGVudGlmaWVySW5FeHByZXNzaW9uKG5vZGUuZXhwcmVzc2lvbiwgbm9kZSk7XG4gIH1cbiAgaWYgKG1hdGNoKG5vZGUsIHt0eXBlOiAnQ2FsbEV4cHJlc3Npb24nfSkpIHtcbiAgICByZXR1cm4gZ2V0Um9vdElkZW50aWZpZXJJbkV4cHJlc3Npb24obm9kZS5jYWxsZWUsIG5vZGUpO1xuICB9XG4gIGlmIChtYXRjaChub2RlLCB7dHlwZTogJ01lbWJlckV4cHJlc3Npb24nfSkpIHtcbiAgICByZXR1cm4gZ2V0Um9vdElkZW50aWZpZXJJbkV4cHJlc3Npb24obm9kZS5vYmplY3QsIG5vZGUpO1xuICB9XG4gIGlmIChtYXRjaChub2RlLCB7dHlwZTogJ0lkZW50aWZpZXInfSkpIHtcbiAgICByZXR1cm4ge25hbWU6IG5vZGUubmFtZSwgcGFyZW50fTtcbiAgfVxuICByZXR1cm4gbnVsbDtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBnZXRSb290SWRlbnRpZmllckluRXhwcmVzc2lvbjtcbiJdfQ==