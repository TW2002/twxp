# Author          : Alexio / Generation 8008
#modified by Rincrast
# Script Name     : Planet to Sector Fighter Dump
# Last Modified   : April. 17, 2003
# Description     : Grabs fighters off a planet and dumps them 
#                   into the sector.
# Updates         : Updated for TWX v2.03
# Downloaded From : www.geocities.com/alexio_scripts/

cutText CURRENTLINE $location 1 7
stripText $location " "
if ($location <> "Planet") AND ($location <> "Citadel")
     ECHO ANSI_12 "**Script Ended: " ANSI_7 "This script must be run from the surface of a planet or citadel"
	send "'SectorFigDump must be run from planet or citadel prompt; script terminated.*"
     halt
end

loadVar $dump_amount
loadVar $fig_type

if ($dump_amount = 0)
	setVar $dump_amount 0
else
	goto :sub_gather
end
if ($fig_type = 0)
	setVar $fig_type d
end
setVar $menu_fig_type "Defensive"

logging off

:sub_menu
echo ansi_11 "**--" ansi_3 "==|" ansi_15 " Alexio's Planet/Sector/Dump " ansi_3 "|==" ansi_11 "--*"
echo ansi_15 "*Planet/Sector/Dump Settings:"
echo ansi_11 "*1 " ansi_3 "- Enter Fig Amount    " ansi_15 $dump_amount "*"
echo ansi_11 "2 " ansi_3 "- Fighter Type        " ansi_15 $menu_fig_type "**"
echo ansi_11 "S " ansi_3 "- Start Planet Drop*"
echo ansi_11 "Q " ansi_3 "- Terminate Script*"
echo ansi_15 "*Main" 
GetConsoleInput $sub_option SINGLEKEY

:option1
if ($sub_option = 1)
     getinput $dump_amount "How many figs do you want to dump?"
     isNumber $test $dump_amount
     if ($test = "FALSE")
          echo ansi_12 "**Invalid Number*"
          goto :option1 
     end
end

if ($sub_option = 2) and ($menu_fig_type = "Defensive")
     setVar $menu_fig_type "Offensive"  
     setVar $fig_type o
elseif ($sub_option = 2) and ($menu_fig_type = "Offensive")
         setVar $menu_fig_type "Toll"
         setVar $fig_type t
elseif ($sub_option = 2) and ($menu_fig_type = "Toll")
         setVar $menu_fig_type "Defensive"
         setVar $fig_type d
end

if ($sub_option = "S") or ($sub_option = "s")
     goto :sub_gather
elseif ($sub_option = "Q") or ($sub_option = "q")
         halt
end 
goto :sub_menu

:sub_gather
if ($location = "Citadel")
	send "q"
end
send "d"
setTextLineTrigger 1 :planet_number "Planet #"
setTextLineTrigger 2 :start_figs "Fighters        N/A"
pause

:planet_number
getWord CURRENTLINE $planet 2
stripText $planet "#"
pause

:start_figs
getWord CURRENTLINE $ship_figs 6
getWord CURRENTLINE $planet_figs 5
stripText $planet_figs ","
stripText $ship_figs ","
if ($dump_amount > $planet_figs)
     echo ansi_12 "*Script Ended : " ansi_7 "Can't move more then what the planet has! sorry man..."
     halt
end

if ($ship_figs <> 0)
     send "m*l*"
end

send "qc;q"
setTextLineTrigger 3 :max_figs "Offensive Odds:"
pause

:max_figs
getText CURRENTLINE $max_figs "Max Fighters:" "Offensive Odds:"
stripText $max_figs ","
stripText $max_figs " "

send "l" $planet "*"

:sub_sectordump

           send " m * t " 
           if ($dump_amount > $max_figs)
                send $max_figs 
                setVar $dump_amount ($dump_amount - $max_figs)
           else 
                send $dump_amount 
                setVar $dump_amount ($dump_amount - $dump_amount)
           end
              
           send " * q f"
           waitFor "<Drop/Take Fighters>" 
           setTextLineTrigger 1 :sector_dump "You have"
           pause

           :sector_dump
           getWord CURRENTLINE $sector_dump 3
           stripText $sector_dump ","
           send $sector_dump "*c" $fig_type           
                  
           waitOn "Command [TL=" 
           send " l " $planet " * "
  
           if ($dump_amount = 0)
                send " m * t " $ship_figs " * "
           else
                goto :sub_sectordump          
           end
if ($location = "Citadel")
	send "c"
end
send "'Sector dump complete; script termininated.*"
setVar $dump_amount 0
saveVar $dump_amount
setVar $fig_type 0
saveVar $fig_type
           halt
