# review/port-queue.md: in each conflict hunk, rows are matched by item number; each side's
# change of a row is kept: a row a side changed from `pending` wins over the other side's
# unchanged `pending` row. If both sides changed one row differently, both are kept and flagged.
import sys,re
p='review/port-queue.md'
out=[];st=None;a=[];b=[];flags=[]
def key(l):
    m=re.match(r'\|\s*(\d+)\s*\|',l); return m.group(1) if m else None
def pend(l): return l.rstrip().endswith('| pending |')
for ln in open(p,encoding='utf8').read().split('\n'):
    if ln.startswith('<<<<<<< '): st='a';a=[];b=[];continue
    if st=='a' and ln.startswith('||||||| '): st='base';continue
    if st in('a','base') and ln=='=======': st='b';continue
    if st=='b' and ln.startswith('>>>>>>> '):
        bd={key(x):x for x in b if key(x)}
        used=set()
        for x in a:
            k=key(x)
            if k and k in bd:
                y=bd[k];used.add(k)
                if x==y: out.append(x)
                elif pend(x): out.append(y)
                elif pend(y): out.append(x)
                else: out+= [x,y]; flags.append(k)
            else: out.append(x)
        out+=[y for y in b if not key(y) or key(y) not in used]
        st=None;continue
    if st=='a': a.append(ln)
    elif st=='b': b.append(ln)
    elif st=='base': pass
    else: out.append(ln)
assert st is None
open(p,'w',encoding='utf8').write('\n'.join(out))
print('port-queue resolved; both-changed rows:',flags)
