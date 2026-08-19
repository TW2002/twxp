Script Title:	Ram_Path-Blast Version 5.11
Author:		RammaR
Revision Date:	7/29/05


Description:
------------
This is an Express Warp style charging / gridding script best used early
in the game or to charge a specific target. 

Fixes from last version:
-----------------------
5.11:
Fixed error that caused it not to report high density scan readings.

5.1:
Fixed Menu system to allow user to specify a custom save-me call.
Fixed density reporting around stardock.

5.0:
Cleaned up menu system for easier use. Added ability to optimize routes
with complete ZTM.  Improved charge macro's for better performance.
Option to report density scans during charge cycles.

4.71:
Will Auto-Land on a "Save Me" planet if corpie is running CK's Saveme version
2.10 or higher.

4.70:
Now works better early in game without a full ZTM.  Does not leave 10 figs
in sectors that it thought were deadends before mapping.

Features:
---------
- Charge 1 sector or grid and entire list.

- Flexible deployment options, specify fighters and type per sector, armid
  and limpet mines per sector.

- Set a different number of figs to mark DE's for quick reference.

- Several anticipation photon avoidance measures : Avoid 2-way sectors,
  or for 2- & 3-way sectors stagger step through them or micro-delay.

- 4 Scanning options: None, Density, Holo or Both.

- If Density scanning, it will report and save any unusual density
  readings at the end of the script.

- Abort / Display sector toggle.  

- Minimum turn and fighter level safeties to stop gridding.

- Can call SaveMe or a custom msg if podded / photoned / or stuck.

- 3 Finishing options: Stay in sector, Call SaveMe, or Retreat to sector.

- Can adjust the number of figs it attacks with to fit the edits of your
  game.  If your grid ship has an wave of 50 figs and you try to use 99
  then you only attack with 9, so use this setting.

Note: Run the script with CN9 = Space, it will build the macros to abort
the displays based on your menu selections.

