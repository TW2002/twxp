Script Title:	Ram_Pwarp_Density_Scout Version 1.1
Author:		RammaR
Revision Date:	7/20/05


Description:
------------
This script will warp a planet around to a list of sectors along an optimized 
path to check for unusual density readings.  Think an enemy is hiding next to
some of your figs -- this will help you find them without wasting turns. 
A very special purpose type of script. 


Updates:
--------
1.1 - Fixed a stablity issue where it would get stuck in a loop around unreachable
      sectors
    - Fixed a bug where it would sometimes not calculate the proper ore on the
      planet and end early.
    - Added option to manually halt the script and save data by hitting the '>' key.

Features:
---------
- Adjustable density alarm limit halting the script.

- Minimum Fuel Ore saftey so you don't run out of gas.

- Outputs a list of:
	sectors scanned
	sectors remaining on your list
        sectors that were unreachable

- easy to resume a previous list.
