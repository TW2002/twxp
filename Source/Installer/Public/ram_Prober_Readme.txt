Script Title:	Ram_Prober Version 1.2
Author:		RammaR
Revision Date:	3/09/05

Fixes:
------
Ver. 1.2:
---------
Fixed bug that required a complete ZTM for probing unexplored
sectors sorted by distance.  Now there is an option to choose 
which mode is best.  

Ver. 1.1:
---------
Now when searching unexplored sectors it will target the furthest
sectors away first in order to try and "see" as many new sectors
along the routes as possible.

Description:
------------
This is a very flexible and powerful Ether Probing script. It has
an option to announce any traders, planets, ships, feds or
class 0's it finds over sub-space for your corpies. It also logs
everything to a file. For sectors that you cannot reach with a
probe, it will save a record of what was the closest sector the
probe reached and how many hops from your target it was. 

Additionally it can read from a user specified file or has the
following built in lists: 

1.) All Deadends 
2.) Unexplored Deadends 
3.) Deadends at X hops from Terra 
4.) Deadends not seen within the last X days 
5.) Random Probing - All Sectors - X # of probes 
6.) Random Unexplored Sectors - X # of probes 
7.) Range From Terra - All sectors with X warps 
8.) Range From Terra - Unexplored with x warps 
9.) Range From Terra - X warps not seen within Y days. 
10. All Unexplored Sectors 
11. Class 0 Type sector search 

For any search that is limited to unexplored sectors, if a sector
is "seen" while probing a different target then it will be removed
from your target list therefore saving time and probes. 

Here is a sample of the unreachable sector report: 

Target Probe 
Sector Destroyed Hops 
----------------------------- 
100 4555 2 
490 693 1 
500 2836 2 


Special Note:
-------------
You can also use this script to generate a list of target sectors 
that match one of the pre-set search options.  Load the script and
select your search but then manually kill the script at the prompt:

"Would you like to clear your avoids? - (Recommended) - <y/n>"

Just above this line it will tell you how many targets were found:

"Found: XXX Targets"

And where the list is saved:

"Your filtered target list is saved as: <GAMENAME>_Probe_Targets.txt"

You can use this file as the input list for a gridder or other script.

Happy Hunting. 