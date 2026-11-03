"""DIAGNOSIS ONLY: deliberately broken copies of a built scratch course, for showing that
core/offline_test.js still fails on broken offline behaviour. Usage:
  python3 -I mutations.py <course root> <mutation>
Mutations (each one edit, which must apply exactly once):
  no-offline-fallback  sw.js: the worker gives up when the network fails, no saved copy
  no-timeout           sw.js: the worker waits for the network, with no NET_TIMEOUT
  no-update-offer      sw.js: the worker never tells the page a newer copy arrived
  down-does-nothing    src/check_lib.js: S.down() leaves the server up"""
import sys
EDITS = {
  'no-offline-fallback': ('sw.js', "  } catch (_) {\n    // offline: fall through to the saved copy\n  }",
                          "  } catch (_) {\n    throw _;   // MUTATION: no saved copy when the network fails\n  }"),
  'no-timeout': ('sw.js', "      new Promise((resolve) => setTimeout(() => resolve('timeout'), NET_TIMEOUT)),\n", ""),
  'no-update-offer': ('sw.js', "if (res && res.ok && differs(res, saved)) return tellUpdated(event);",
                      "if (res && res.ok && differs(res, saved)) return;"),
  'down-does-nothing': ('src/check_lib.js', "    S.down = () => new Promise(done => {\n      S.mode = 'down';",
                        "    S.down = () => new Promise(done => { done(); return;\n      S.mode = 'down';"),
}
root, name = sys.argv[1], sys.argv[2]
f, a, b = EDITS[name]
p = root + '/' + f
s = open(p).read()
if s.count(a) != 1: sys.exit(f'{name}: the edit does not apply to {f}')
open(p, 'w').write(s.replace(a, b))
print(f'mutation {name} applied to {f}')
