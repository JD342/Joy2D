
const { resolve, join } = require('path');

exports.MAIN_DIR          = resolve(__dirname, '..', '..');
exports.SRC_DIR           = join(exports.MAIN_DIR, 'source');
exports.BUILD_DIR         = join(exports.MAIN_DIR,'build');
exports.LICENSE_FILE      = join(exports.MAIN_DIR, 'LICENSE');
exports.PACKAGE_FILE      = join(exports.MAIN_DIR, 'package.json');
exports.ORDER_FILE        = join(exports.SRC_DIR, 'order.json');
exports.UNCOMPR_BUILD_DIR = join(exports.BUILD_DIR, 'uncompressed');
exports.UNCOMPR_BUILD     = join(exports.UNCOMPR_BUILD_DIR, 'joy2d.js');
exports.UNCOMPR_BUILD_MAP = join(exports.UNCOMPR_BUILD_DIR, 'joy2d.js.map');
exports.MINIF_BUILD_DIR   = join(exports.BUILD_DIR, 'minified');
exports.MINIF_BUILD       = join(exports.MINIF_BUILD_DIR, 'joy2d.min.js');
exports.MINIF_BUILD_MAP   = join(exports.MINIF_BUILD_DIR, 'joy2d.min.js.map');
exports.NPM_BIN           = join(exports.MAIN_DIR, 'node_modules', '.bin');
