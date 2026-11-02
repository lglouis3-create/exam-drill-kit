# Resolve conflict markers by keeping both sides (ours first, then theirs).
# Lines identical on both sides of a hunk that are markdown headings are kept once.
import sys,re
for p in sys.argv[1:]:
    out=[];st=None;a=[];b=[];hunks=0
    for ln in open(p,encoding='utf8').read().split('\n'):
        if ln.startswith('<<<<<<< '): st='a';a=[];b=[];continue
        if st=='a' and ln.startswith('||||||| '): st='base';continue
        if st in('a','base') and ln=='=======': st='b';continue
        if st=='b' and ln.startswith('>>>>>>> '):
            hunks+=1
            bb=[x for x in b if not (x.startswith('#') and x in a)]
            out+=a+bb;st=None;continue
        if st=='a': a.append(ln)
        elif st=='b': b.append(ln)
        elif st=='base': pass
        else: out.append(ln)
    assert st is None,p
    open(p,'w',encoding='utf8').write('\n'.join(out))
    print(p,'hunks',hunks)
