The main file is EP_Haggle2019.cts.
The file first starts with a list of options.  You can access this list of options at anytime by hitting semi-colon (;).  Options are saved, and subsequent launches will use saved options.

The included file, haggle.ts, is for making TWX's Pack 2 scripts use this haggle routine rather than TWX's Pack 2 Haggle routine.  Simply rename the haggle.ts file in the Include subfolder to something like haggle.orig, and then add this haggle.ts script to the include folder.

N.B.  If your haggles are rejected by the port, you probably have option 1, Haggle and Hold, set to On.

1 - Haggle and Hold:  Attempts to derive the MCIC without completing the buy/sell of product.

2 - Worst Price:  Used to load a port with credits for MegaRob by paying too much for a product.

3 - MBBS Mode:  This is to help discern if the max qty available on a port will be 65530 or 32760.

4 - Planetary Trade %:  This value is obtained by hitting * at the "==-- Trade Wars 2002 --==" game login screen.  The PTrade% is listed under [SETTINGS], and is CRITICAL for the haggle to perform Planet Negotiations.

5 - Blue Haggle:  Haggles perfectly, but on the final offer it will bid 1 credit less than 98%, thereby avoiding exp gains.

6 - Swath Offer Capture:  Will trap Swath's bids, making it compatable with Swath's scripts like WorldTrade and PPT.

7 - Haggle Toggle:  Active or Inactive

8 - Suppress Menu on Load:  Prevents this menu from automatically displaying at script launch.

9 - Query DB for Current Port Info:  Lists known MCIC values for the sector you are currently in.

W - Write Sector Parameters to file:  Creates a .csv file of all known MCIC and Productivity values.

I - Import Sector Parameters from file:  Loads MCIC and Productivity data from a .csv file into the current database.

X - Exit and write data to file:  Same as 9, then halts.