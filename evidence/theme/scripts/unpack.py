import json, os, tarfile, glob
os.chdir('/tmp/port-theme/mods')
for f in sorted(glob.glob('*.tar')):
    n = f[:-4]
    os.makedirs(n, exist_ok=True)
    with tarfile.open(f) as t: t.extractall(n, filter='data')
    m = json.load(open(f'{n}/features/{n}/current/module.json'))
    print(n, 'version', m.get('version'), 'oncourse', os.path.exists(f'{n}/features/{n}/ci/oncourse.js'), 'needs', m.get('needs', []),
          'modules in tree', sorted(os.listdir(f'{n}/features')))
