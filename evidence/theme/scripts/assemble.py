import os, shutil, glob, re
E, OUT = '/tmp/port-theme/evidence', '/tmp/port-theme/ev/evidence/theme'
shutil.rmtree(OUT, ignore_errors=True); os.makedirs(OUT)
for d in ['logs', 'mutations', 'mutations-run2', 'mutations-run3', 'mutations-run4', 'mutations-final']:
    shutil.copytree(os.path.join(E, d), os.path.join(OUT, d))
for f in glob.glob(E + '/ci-job-*.log'): shutil.copy(f, OUT)
os.makedirs(OUT + '/sweep')
for f in glob.glob(E + '/sweep/*.tsv') + glob.glob(E + '/sweep/*.md') + glob.glob(E + '/sweep/build-*.log'): shutil.copy(f, OUT + '/sweep')
keep = re.compile(r'(tab_topics|tab_quiz|quiz_card_answered_wrong|exam_result)')
n = 0
for d in sorted(glob.glob(E + '/sweep/shots-*')):
    m = os.path.basename(d)[6:]
    o = f'{OUT}/sweep/shots/{m}'; os.makedirs(o)
    for f in glob.glob(d + '/*-views.json'): shutil.copy(f, o)
    for f in sorted(glob.glob(d + '/*.png')):
        if keep.search(os.path.basename(f)): shutil.copy(f, o); n += 1
os.makedirs(OUT + '/scripts')
for f in ['pick.js', 'mkfix.js', 'owncourse.js', 'mkon.sh', 'run.sh', 'mutations.py', 'sweep.sh', 'final.sh', 'table.py', 'unpack.py', 'heads.txt', 'assemble.py']:
    shutil.copy('/tmp/port-theme/tools/' + f, OUT + '/scripts')
shutil.copy('/tmp/port-theme/integ/contrast_test.js', OUT + '/scripts/contrast_test.js')
print('screenshots kept', n)
