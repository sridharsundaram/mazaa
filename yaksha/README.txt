Using Sympy

Symbols are created by using 
x = Symbol('x')

to bind,use a map from nameofsymbol to its value
e.g. 
val = {'x':3}

Then x.subs(val) will evaluate to 3
-------------------------------------------
We will use variables with variable names beginning with $.
e.g. $x, $days etc.

import random
print random.random()
This prints a random floating point number in the range [0, 1) (that is, between 0 and 1, including 0.0 but always smaller than 1.0).

There are also many other specialized generators in this module, such as:

randrange(a, b) chooses an integer in the range [a, b).
uniform(a, b) chooses a floating point number in the range [a, b).
normalvariate(mean, sdev) samples the normal (Gaussian) distribution.
Some higher-level functions operate on sequences directly, such as:

choice(S) chooses a random element from a given sequence (the sequence must have a known length).
shuffle(L) shuffles a list in-place, i.e. permutes it randomly

MontyLingua
-----------------
  m = MontyLingua.MontyLingua()
  
  #sentence_type: imperative, question, declaration, can, may, would, should, could, who, what, when, where, why, how
  #tense: present, past, future, past_progressive, progressive, infinitive
  def generate_sentence(self):
    vsoo = ('build','$nmen man','a $length wall', 'in $time hours')
    #s = self.m.generate_sentence(vsoo,sentence_type='declaration',tense='present', s_dtnum=('',3))
    s = self.m.generate_sentence(vsoo,sentence_type='question',tense='future', s_dtnum=('',3))
        ,s_dtnum=('',1),o1_dtnum=('',1),o2_dtnum=('',1),o3_dtnum=('',1))
    return s

    
TODO
--------
1. How to provide graded degree-of-difficulty?
2. Tags for templates/problems
6. Syllabus concept with weightage -
7. Question paper generation on selected topics with selected weightage. 
9. decimals - number of decimal places as part of domain
10. Irrationals - how to generate?
11. Assessment
12. domain for templates should allow more config or degree-of-difficulty should automatically configure per problem

git@github.com:sridharsundaram/mazaa.git

Knowledge Unit has different levels and different domains.
Hence, it is defined by (name, degreeofdifficulty, domain)
a syllabus item will have to specify all three.

Can one syllabus item specify multiple knowledge units? 
If it does, it should be broken up into smaller syllabus units.

Thus each syllabus item specifies one knowledge unit. 
We can save that knowledge unit along with the syllabus item itself.
Each problem gets tagged with multiple knowledge units.

Given a syllabus item, we find all problems matching its knowledge unit.
Hence a syllabus item will have (description, kuName, kuDifficulty, kuDomain) 


------------------------------------------------------------
git@github.com:sridharsundaram/simple.git

appcfg.py --num_days=0 request_logs <local app directory> output.txt
local app directory is c:\users\sridhar\git\simple\simple
appcfg.py --num_days=0 request_logs c:\users\sridhar\git\simple\simple output.txt
