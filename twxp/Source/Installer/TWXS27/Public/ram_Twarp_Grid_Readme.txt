Script Title:	Twarp Gridder Version 1.95 
Author:		RammaR
Revision Date:	7/29/05

Note:		An accurate ZTM is a MUST for this script to function properly.

Description:
------------
This script will use a ship equipped with a Trans Warp Drive to grid a list of
supplied target sectors with varying levels of speed and safety. It keeps track
of your fig deployments	and uses a near-fig routine to determine the next best
jumps.	It will not grid towards the same sector twice and it will not jump you
within 3 hops of your last gridded sector.


Updates for 1.95
----------------
Fixed error that caused it not to report high density scan readings.

Updates for 1.94
----------------
Fixed stability issue with holo scan reports over 50 lines.  
The script will no longer refuel or start a charge path adjacent to stardock.


Updates to Version 1.90
-----------------------
Option to report unusual densities along route when scanning.  Option to skip
density scan in the last sector for faster jump-out. 

Updates to Verison 1.8x
-----------------------
Better overall speed with a faster nearest fig / ore port routine and faster
updates to the fighter grid when loading the script. An option has been added
to either "Skip Sector" or "Abort Gridding" when it finds a high density sector
on jump out. Listed under Option "6" in the main menu.  Also, it can now handle
target list filenames with spaces and will not crash and force a reload if it 
can't find the correct file. 


Updates to version 1.6:
-----------------------
Now has the option to drop Armid / Limpet mines only in your jump sectors.  
Will Auto-Land on a "Save Me" planet if corpie is running CK's Saveme version
2.10 or higher.  Better overall stability and accuracy.

NOTE: Will reset saved configuration data from previous versions.


Features:
---------
- 4 Gridding Modes: Standard Charges, Short Charges, Flexible Charges,
  & Random Surrounds.

- 3 Refueling Options: Starting Port, Random Ports, or a Planet.

- Resume Feature for continuing a target list from where you last left off.

- Options to use planet Xporter for greater range and refill figs from planet
  between cycles.

- Set how many figs and what kind to deploy per Sector and per DE.

- Set how many Limpet and/or Armid mines to drop per sector.

- Several scanning options: None, Density, Holo, Both, Density only after 
  jumps.

- If any form of denisty scanning is used, it will display any "unusual" 
  findings as well as save them to a file for later reference.

- Toggle on or off sector displays for increased speed.

- Risk Blind Warp Toggle for maximum speed on exiting gridded sectors.

- Advanced safety options: low Turn and low Fighter warnings.

- Save Me options:  Standard, custom msg, or silent.

- Specified Scrub Sector - to clean a potential limpet or return to fed
  when done.

- Checks density in adj sectors on jump out prior to surrounding or charging.

- Toggle to Abort Gridding or Skip Sector if high density is found.


Menu Descriptions:
------------------

"1 - Target Sector List:  Must Set!"
------------------------------------
Use this option to input the sectors you would like to grid.  You can
enter sectors seperated by comma's (11,12,13,14,15) or enter a filename
that has the sectors listed like deadends.txt. 

Note:  If you last ran the script with an input file, then you can Resume
       from where you left off.  This can be very handy for gridding in
       short blocks without repeating the same sectors over and over.

"2 - Gridding Mode (Charge, Short Charge, Random)    Flexible Charges"
----------------------------------------------------------------------
This lets you choose how to grid those target sectors.

Standard Charges: Jumps / beams to the nearest fig and charges all the
                  way to the target sector then jumps clear.

Short Charges:    Jumps / beams to the nearest fig and then charges
                  X-hops (1,2,3 etc.) towards the target then jumps clear.

Flexible Charges: Jumps / beams to the nearest fig and then charges towards
                  the target through any 4, 5, or 6-warp sectors.  Once it
                  hits a 2 or 3-warp sector it jumps clear.

Random Surrounds: This mode lets you specify to grid sectors with at least
                  X number of open adjacent sectors.  It will jump/beam
                  out to a sector - fig any surrounding sectors that you
                  don't already own - then jump clear.  This mode cannot
                  be used with Random Refueling Ports.

"3 - Refueling Source (Port, Planet)                 Random Port"
-----------------------------------------------------------------

There are 3 options for refueling your ship.

Buy From This Port:   Uses your starting sector for ore.  It will jump out,
                      grid a set of sectors then return to this sector to
                      refuel before running the next path.  Have a corpie
                      drop personal limpets in this sector to block an
                      enemy from tracking you to this sector.
 
Buy From Random Port: Uses the closest fig'd Ore selling port to the start
                      of your next route to refuel.  You might carry a
                      limpet with you but in most cases won't stay in a 
                      given sector long enough for an enemy to setup a trap.

Use Planet Ore:       This Option allows you to refuel from a planet in your
                      starting sector instead of buying from a port.  It
                      functions much the same as the first option above in
                      that you will return to this sector after each path
                      cycle, so again drop limpets to avoid being tracked!
                      It also allows you 2 special options. 1.) to use the
                      planets Xporter instead of your Twarp, which can
                      increase your range as well as save turns depending
                      on the edits.  2.) It will let you refill your ship
                      with figs in between runs so your less likely to run
                      out.

"4 - Number of Paths to Run -                        All Paths"
---------------------------------------------------------------

This allows you to specify how many paths or cycles to run before scrubbing.
The default setting is to run all possible paths until you are either out
of turns, low on figs, or all of the targets have been reached.  However
you can set it to run say 5 paths at a time then jump to your scrub sector.
This allows to grid in small chunks, while updating your cim data in between.

"5 - Deployment Options -  Figs / Mines              1, Def. A: 0 L: 0"
-----------------------------------------------------------------------

This lets you specify how many fighters to drop in each gridded sector and
if they should be Offensive, Defensive or Toll.  You can also set a
different number of figs to mark DE's for easy recognition later on.  This
area also lets you specify how many Armid and Limpet mines to drop per
sector.  You can set it to deploy mines in No sectors, All Sectors or in
your Jump Sectors only. And the final option allows you to adjust the
number of figs you attack with when entering a sector.  The default value
is: 9876543210, however it the max wave of your gridding ship is only 20
then it would attack with 9 figs.  So this option gives you the
flexiblitiy to adjust the script to the edits you are playing.

"6 - Scanning / Speed Options -                      Jump Only, Abort, Risk"
----------------------------------------------------------------------------	
These options can greatly affect the amount of speed and data the script
gives you. 

Scanning Mode: 	None, Density, Holo, Both, or Jump Density scanning.  If
                using any form of Density scanning then when the script
                is completed it will display any unusual readings as well
                as save a copy to a file for later reference. Keep in
                mind that the more you scan the slower the script will
                run but the more data you will gather - so use the trade
                off wisely.

Jump Density Safety Limit:
 		When performing any density scan (Jump Only, Density, Holo &
                Density) after T-warping to the closest fig to your next
                Target sector it will check any adjacent sectors for unusual
                density readings.  NOTE: It only responds to sectors around 
                your jump point as all scans after that are part of the burst
                movement.  If you see a density reading higher then this
                safety limit then the script will immediately try to reach
                your scrub sector and terminate normally.


High Density Reaction:
		Set this to Abort Gridding if you want the script to jump to
		your safe sector or call save me if you find something above
		the safety threshold set above. Or set it to Skip Sector and
		it will report and log the sector but continue with the 
		target list.


Abort Sector Display: 	This will be similar to running with CN9 set to
                        ALL KEYS when you are not actually scanning each
                        sector as you grid.  It aborts the sector display 
                        to maximize speed.

Risk Blind Warps:  The script keeps track of your fig grid while you are
                   gridding, however it will not log any enemy hits on your
                   figs.  There is a slight delay in waiting for a "good
                   lock" on jumping out. If charging certain routes that
                   could be hit with a predictive photon then this extra
                   lag can sometimes cause allow you to be hit.  Enabling
                   this option uses a macro to warp to your next jump sector
                   with maximum speed.

"7 - Safety / SaveMe Options -                       T: 50 F: 75, Save Me"
--------------------------------------------------------------------------
Here you can set your Minimum Turn and Fighter levels.  If you drop below
either of these then the script will terminate. Also, you can set the
script to send out a Save Me hail if you are photoned, stuck or podded
while gridded.  This can be the standard "xxxx=saveme" trigger or a
custom trigger that you specify.

"8 - Scrub Sector (Final Jump Sector)                Jump To: 1"
----------------------------------------------------------------
This option lets you specify where to end the script at safely to scrub
any potential limpets.  If using a Planet for fuel then the script
requires you to use that sector, however with Port refueling you can
specify any sector.  
                       
"9 - Report Progress on SubSpace -                   Send Reports"
------------------------------------------------------------------
This is a toggle to keep your corpies updated on your progress: cycles
complete, turns, figs.  But if it is too much sub-space spam then you
can turn it off.



One final note:
Gridding is dangerous and while this script has several settings to
minimize your risk it cannot guarentee you will be 100% safe.  Choosing
the best way to grid will depend on your competition and the edits for
that particular game.  Experiment with different settings and find out
what combinations work best for you.

Default settings:
	Flexible Charges
	Random Refueling Ports
	All Paths
	1 Def fig per sector
	10 Def figs per DE
	0 armid and 0 limpet mines per sector
	"9876543210" attack macro
        Jump Only Density Scanning
	Jump Density Safety Limit: 1000
        Abort Sector Displays
	Risk Blind Warp Jumps
	Min. Turns: 50
        Min. Figs: 75
        Call Save Me if photoned / podded / stuck
	Send Reports Over SubSpace


Good Luck!
        
If you find a bug then please let me know so that it can be
corrected.  My ICQ# is: 135333708


	

 
 


