p = '/tmp/port-study-controls/evidence/INDEX.md'
t = open(p, encoding='utf8').read()
rows = open('/tmp/port-study-controls/commands-table.md', encoding='utf8').read().rstrip('\n')
assert t.count('COMMANDS_TABLE') == 1
open(p, 'w', encoding='utf8').write(t.replace('COMMANDS_TABLE', rows))
print('ok')
