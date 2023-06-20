
# -------------------------------------------------------------------

systemScript
send "'Dnyarri's Dock Survival ToolKit Activated.*"
clientMessage "Dnyarri's dock kit active - Hit the underscore key, _, to load at dock."

:lurk
killalltriggers
setTextOutTrigger lurky_trigger :activate_program "_"
pause

# -------------------------------------------------------------------

:activate_program
setVar $at_dock FALSE
getWord CURRENTLINE $prompt_check 1
if ($prompt_check = "<StarDock>")
     setVar $at_dock TRUE
elseif ($prompt_check = "<Hardware")
     setVar $at_dock TRUE
elseif ($prompt_check = "<Libram")
     setVar $at_dock TRUE
elseif ($prompt_check = "<FedPolice>")
     setVar $at_dock TRUE
elseif ($prompt_check = "<Shipyards>")
     setVar $at_dock TRUE
elseif ($prompt_check = "<Tavern>")
     setVar $at_dock TRUE
else
     setVar $at_dock FALSE
end
if ($at_dock <> TRUE)
     clientMessage "Cannot run here! - Must be at one of the StarDock prompts."
     goto :lurk
end

# -------------------------------------------------------------------

:print_the_menu
gosub :do_quickstats
echo "[2J"

:menu_without_clear
killalltriggers
echo "*"
echo ANSI_15 "      -=( " ANSI_12 "Dnyarri's Dock Survival Toolkit" ANSI_15 " )=-  *"
echo ANSI_2  "      It's rough out there... try not to die.*"
echo ANSI_5  "---------------------------------------------------*"
echo ANSI_11 " 1 " & ANSI_9 & "Lift," & ANSI_14 & " display stardock sector" & ANSI_9 & ", re-dock*"
echo ANSI_11 " 2 " & ANSI_9 & "Lift," & ANSI_14 & " holoscan" & ANSI_9 & ", re-dock*"
echo ANSI_11 " 3 " & ANSI_9 & "Lift," & ANSI_14 & " density scan" & ANSI_9 & ", re-dock*"
echo ANSI_11 " 4 " & ANSI_9 & "Lift," & ANSI_14 & " get xport list" & ANSI_9 & ", re-dock*"
echo ANSI_11 " 5 " & ANSI_9 & "Lift," & ANSI_14 & " get planet list" & ANSI_9 & ", re-dock*"
echo ANSI_11 " 6 " & ANSI_9 & "Lift," & ANSI_14 & " check twarp lock" & ANSI_9 & ", re-dock*"
echo ANSI_11 " 7 " & ANSI_9 & "Lift," & ANSI_14 & " twarp out*"
echo ANSI_11 " 8 " & ANSI_9 & "Lift," & ANSI_14 & " lock tow" & ANSI_15 & ", twarp out*"
echo ANSI_11 " 9 " & ANSI_9 & "Lift," & ANSI_14 & " xport" & ANSI_9 & ", re-dock*"
echo ANSI_11 " A " & ANSI_9 & "Lift," & ANSI_14 & " launch mine disrupter" & ANSI_9 & ", re-dock*"
echo ANSI_11 " B " & ANSI_9 & "Lift," & ANSI_14 & " set avoid" & ANSI_9 & ", re-dock*"
echo ANSI_11 " C " & ANSI_9 & "Lift," & ANSI_14 & " clear avoided sector" & ANSI_9 & ", re-dock*"
echo ANSI_11 " D " & ANSI_9 & "Lift," & ANSI_14 & " plot course" & ANSI_9 & ", re-dock*"
echo ANSI_11 " E " & ANSI_9 & "Lift," & ANSI_14 & " make a planet" & ANSI_9 & ", re-dock*"
echo ANSI_11 " F " & ANSI_9 & "Lift," & ANSI_14 & " land on a planet and drop ore" & ANSI_9 & ", re-dock*"
echo ANSI_11 " G " & ANSI_9 & "Lift," & ANSI_14 & " land on a planet and take all" & ANSI_9 & ", re-dock*"
echo ANSI_11 " H " & ANSI_9 & "Lift," & ANSI_14 & " land on and destroy a planet" & ANSI_9 & ", re-dock*"
echo ANSI_11 " Z " & ANSI_9 & "Lift," & ANSI_14 & " cloak out*"
echo ANSI_11 " L " & ANSI_9 & "Lift," & ANSI_14 & " get corpie locations" & ANSI_9 & ", re-dock*"
echo ANSI_11 " W " & ANSI_9 & "Lift," & ANSI_14 & " C U Y (enable t-warp)" & ANSI_9 & ", re-dock*"
echo ANSI_11 " T " & ANSI_9 & "Lift," & ANSI_14 & " toggle cn9" & ANSI_9 & ", re-dock*"
echo "*"
echo ANSI_11 " O " & ANSI_5 & "Ore Swapper X-port*"
echo "*"
echo ANSI_11 " ! " & ANSI_12 & "Terminate Program.*"
echo ANSI_5  "---------------------------------------------------*"

echo ANSI_10 "Your choice? "
getConsoleInput $chosen_option SINGLEKEY
upperCase $chosen_option

:process_command
if ($chosen_option = "1")
     send "qqq  z  n  dp  s  s "
     waitFor "Landing on Federation StarDock."
     waitFor "<Shipyards> Your option (?)"

elseif ($chosen_option = "2")
     send "qqq  z  n  sh*  p  s  s "
     waitFor "Landing on Federation StarDock."
     gosub :do_quickstats
     waitFor "<Shipyards> Your option (?)"

elseif ($chosen_option = "3")
     send "qqq  z  n  sdp  s  s "
     waitFor "Landing on Federation StarDock."
     waitFor "<Shipyards> Your option (?)"

elseif ($chosen_option = "4")
     send "qqq  z  n  x**    p  s  s "
     waitFor "Landing on Federation StarDock."
     waitFor "<Shipyards> Your option (?)"

elseif ($chosen_option = "5")
     send "qqq  z  n  l*  q  q  z  n  p  s  s "
     waitFor "Landing on Federation StarDock."
     waitFor "<Shipyards> Your option (?)"

elseif ($chosen_option = "6")
     # Status checking
     if ($quickstats[TWARP] = "No")
           echo ANSI_12 "**Cannot T-warp. No Twarp drive!*"
           goto :menu_without_clear
     elseif ($quickstats[ORE] < 3)
           echo ANSI_12 "**Cannot T-warp. No ore!*"
           goto :menu_without_clear
     end
     
     # Get and check input.
     getInput $sector "Check sector: "
     isNumber $numtest $sector
     if ($numtest < 1)
           echo ANSI_12 "**Invalid sector number!*"
           goto :menu_without_clear
     end
     if ($sector < 1) OR ($sector > SECTORS)
           echo ANSI_12 "**Invalid sector number!*"
           goto :menu_without_clear
     end

     # Set detection triggers
     setVar $msg ""
     killtrigger det_trg1
     killtrigger det_trg2
     killtrigger det_trg3
     killtrigger det_trg4
     setTextLineTrigger det_trg1 :det_blnd "Do you want to make this jump blind?"
     setTextLineTrigger det_trg2 :det_fuel "You do not have enough Fuel Ore to make the jump."
     setTextLineTrigger det_trg3 :det_good "Locating beam pinpointed, TransWarp Locked."
     setTextLineTrigger det_trg4 :det_dock "Landing on Federation StarDock."

     # Send macro
     send "qqq  z  n  m  " & $sector & "  *  yn  *  *  p  s  s "
     pause
     goto :print_the_menu

     :det_blnd
     setVar $msg ANSI_12 & "**No fighter lock exists. Blind warp hazard!!*"
     pause

     :det_fuel
     setVar $msg ANSI_12 & "**Not enough ore for that jump!*"
     pause

     :det_good
     setVar $msg ANSI_10 & "**Fighter lock found. Looks good!*"
     pause

     :det_dock
     waitFor "<Shipyards> Your option (?)"
     killtrigger det_trg1
     killtrigger det_trg2
     killtrigger det_trg3
     killtrigger det_trg4
     echo $msg
     goto :menu_without_clear

elseif ($chosen_option = "7")
     # Status checking
     if ($quickstats[TWARP] = "No")
           echo ANSI_12 "**Cannot T-warp. No Twarp drive!*"
           goto :menu_without_clear
     elseif ($quickstats[ORE] < 3)
           echo ANSI_12 "**Cannot T-warp. No ore!*"
           goto :menu_without_clear
     end
     
     # Get and check input
     getInput $sector "T-Warp to: "
     isNumber $numtest $sector
     if ($numtest < 1)
           echo ANSI_12 "**Invalid sector number!*"
           goto :menu_without_clear
     end
     if ($sector < 1) OR ($sector > SECTORS)
           echo ANSI_12 "**Invalid sector number!*"
           goto :menu_without_clear
     end
     echo "**"
     echo ANSI_15 "Twarping out in a macro is risky, you will fuse if you don't*"
     echo ANSI_15 "type things exactly right. I can lift and check the lock before*"
     echo ANSI_15 "you warp out. This is risky, if dock has been blown you will*"
     echo ANSI_15 "get stuck in sector or die on the rad. It also costs a turn,*"
     echo ANSI_15 "but will prevent fusing.*"
     :conf_1
     echo ANSI_10 "*Confirm warp lock? (y/n)"
     getConsoleInput $conf SINGLEKEY
     upperCase $conf
     if ($conf <> "Y") AND ($conf <> "N")
          goto :conf_1
     end

     # Go ahead if the answer is no
     if ($conf = "N")
          send "qqq  z  n  m  " & $sector & "  *  y  y  y  *  d"
          goto :lurk
     end

     # Otherwise, set the detection triggers
     setVar $msg ""
     killtrigger det_trg1
     killtrigger det_trg2
     killtrigger det_trg3
     killtrigger det_trg4
     setTextLineTrigger det_trg1 :twp_blnd1 "Do you want to make this jump blind?"
     setTextLineTrigger det_trg2 :twp_fuel1 "You do not have enough Fuel Ore to make the jump."
     setTextLineTrigger det_trg3 :twp_good1 "Locating beam pinpointed, TransWarp Locked."
     setTextLineTrigger det_trg4 :twp_dock1 "Landing on Federation StarDock."

     # Send the test macro
     send "qqq  z  n  m  " & $sector & "  *  yn  n  *  *  p  s  s "
     pause

     :twp_blnd1
     setVar $msg ANSI_12 & "**No FTR Lock!! Aborting T-warp.*"
     pause

     :twp_fuel1
     setVar $msg ANSI_12 & "**Not enough fuel!! Aborting T-Warp.*"
     pause

     :twp_good1
     setVar $msg "Ftr Lock Found!"
     pause

     :twp_dock1
     # Back at dock, results of the verification?
     killtrigger det_trg1
     killtrigger det_trg2
     killtrigger det_trg3
     killtrigger det_trg4
     if ($msg <> "Ftr Lock Found!")
          echo $msg
          goto :menu_without_clear          
     else
          getRnd $rand_wait 400 1000
          killtrigger safety_delay 
          setDelayTrigger safety_delay :twarp1 $rand_wait
          echo ANSI_11 & "*Preparing for T-Warp, one moment...**"
          pause

          :twarp1
          killtrigger safety_delay
          send "qqq  z  n  m  " & $sector & "  *  y  y  y  *  d"
     end
     goto :lurk

elseif ($chosen_option = "8")
     # Status checking
     if ($quickstats[TWARP] = "No")
           echo ANSI_12 "*Cannot T-warp. No Twarp drive!*"
           goto :menu_without_clear
     elseif ($quickstats[ORE] < 3)
           echo ANSI_12 "*Cannot T-warp. No ore!*"
           goto :menu_without_clear
     end
     
     # Get and check input
     getInput $shipnum "Ship number to tow: "
     isNumber $numtest $shipnum
     if ($numtest < 1)
           echo ANSI_12 "*Invalid ship number!*"
           goto :menu_without_clear
     end
     if ($shipnum < 1) OR ($shipnum > 65000)
           echo ANSI_12 "*Invalid ship number!*"
           goto :menu_without_clear
     end
     getInput $sector "T-Warp to: "
     isNumber $numtest $sector
     if ($numtest < 1)
           echo ANSI_12 "*Invalid sector number!*"
           goto :menu_without_clear
     end
     if ($sector < 1) OR ($sector > SECTORS)
           echo ANSI_12 "*Invalid sector number!*"
           goto :menu_without_clear
     end
     echo "**"
     echo ANSI_15 "Twarping out in a macro is risky, you will fuse if you don't*"
     echo ANSI_15 "type things exactly right. I can lift and check the lock before*"
     echo ANSI_15 "you warp out. This is risky, if dock has been blown you will*"
     echo ANSI_15 "get stuck in sector or die on the rad. It also costs a turn,*"
     echo ANSI_15 "but will prevent fusing.*"
     :conf_2
     echo ANSI_10 "*Confirm warp lock? (y/n)"
     getConsoleInput $conf SINGLEKEY
     upperCase $conf
     if ($conf <> "Y") AND ($conf <> "N")
          goto :conf_2
     end

     # Go ahead if the answer is no
     if ($conf = "N")
          send "qqq  z  n  w  n  *  w  n" & $shipnum & "*  n  n  *  m  " & $sector & "  *  y  y  y  *  d"
          goto :lurk
     end

     # Otherwise, set the detection triggers
     setVar $msg ""
     killtrigger det_trg1
     killtrigger det_trg2
     killtrigger det_trg3
     killtrigger det_trg4
     setTextLineTrigger det_trg1 :twp_blnd2 "Do you want to make this jump blind?"
     setTextLineTrigger det_trg2 :twp_fuel2 "You do not have enough Fuel Ore to make the jump."
     setTextLineTrigger det_trg3 :twp_good2 "Locating beam pinpointed, TransWarp Locked."
     setTextLineTrigger det_trg4 :twp_dock2 "Landing on Federation StarDock."

     # Send the test macro
     send "qqq  z  n  w  n  *  w  n" & $shipnum & "*  n  n  *  m  " & $sector & "  *  yn  n  *  w  n  *  p  s  s "
     pause

     :twp_blnd2
     setVar $msg ANSI_12 & "**No FTR Lock!! Aborting T-warp.*"
     pause

     :twp_fuel2
     setVar $msg ANSI_12 & "**Not enough fuel!! Aborting T-Warp.*"
     pause

     :twp_good2
     setVar $msg "Ftr Lock Found!"
     pause

     :twp_dock2
     # Back at dock, results of the verification?
     killtrigger det_trg1
     killtrigger det_trg2
     killtrigger det_trg3
     killtrigger det_trg4
     if ($msg <> "Ftr Lock Found!") 
          echo $msg
          goto :menu_without_clear          
     else
          getRnd $rand_wait 400 1000
          killtrigger safety_delay 
          setDelayTrigger safety_delay :twarp2 $rand_wait
          echo ANSI_11 & "*Preparing for T-Warp, one moment...**"
          pause

          :twarp2
          killtrigger safety_delay
          send "qqq  z  n  w  n  *  w  n" & $shipnum & "*  n  n  *  m  " & $sector & "  *  y  y  y  *  d"
     end
     goto :lurk

elseif ($chosen_option = "9")
     # Get and check input
     getInput $shipnum "Ship number to xport to: "
     isNumber $numtest $shipnum
     if ($numtest < 1)
           echo ANSI_12 "*Invalid ship number!*"
           goto :menu_without_clear
     end
     if ($shipnum < 1) OR ($shipnum > 65000)
           echo ANSI_12 "*Invalid ship number!*"
           goto :menu_without_clear
     end

     # Set the detection triggers
     setVar $msg ""
     killtrigger det_trg1
     killtrigger det_trg2
     killtrigger det_trg3
     killtrigger det_trg4
     killtrigger det_trg5
     killtrigger det_trg6
     setTextLineTrigger det_trg1 :xport_notavail "That is not an available ship."
     setTextLineTrigger det_trg2 :xport_badrange "only has a transport range of"
     setTextLineTrigger det_trg3 :xport_security "SECURITY BREACH! Invalid Password, unable to link transporters."
     setTextLineTrigger det_trg4 :xport_noaccess "Access denied!"
     setTextLineTrigger det_trg5 :xport_xprtgood "Security code accepted, engaging transporter control."
     setTextLineTrigger det_trg6 :xport_go_ahead "Landing on Federation StarDock."

     # Send the macro
     send "qqq  z  n  x    " & $shipnum & "    *    *    *    p  s  s "
     pause
     goto :print_the_menu

     :xport_notavail
     setVar $msg ANSI_12 & "**That ship is not available.*"
     pause

     :xport_badrange
     setVar $msg ANSI_12 & "**That ship is too far away.*"
     pause

     :xport_security
     setVar $msg ANSI_12 & "**That ship is passworded.*"
     pause

     :xport_noaccess
     setVar $msg ANSI_12 & "**Cannot access that ship.*"
     pause

     :xport_xprtgood
     setVar $msg ANSI_10 & "**Xport good!*"
     pause

     :xport_go_ahead
     gosub :do_quickstats
     waitFor "<Shipyards> Your option (?)"
     killtrigger det_trg1
     killtrigger det_trg2
     killtrigger det_trg3
     killtrigger det_trg4
     killtrigger det_trg5
     killtrigger det_trg6
     echo $msg
     goto :menu_without_clear

elseif ($chosen_option = "A")
     # Get and check input.
     getInput $sector "To sector: "
     isNumber $numtest $sector
     if ($numtest < 1)
           echo ANSI_12 "**Invalid sector number!*"
           goto :menu_without_clear
     end
     if ($sector < 1) OR ($sector > SECTORS)
           echo ANSI_12 "**Invalid sector number!*"
           goto :menu_without_clear
     end

     # Set the detection triggers
     setVar $msg ""
     killtrigger det_trg1
     killtrigger det_trg2
     killtrigger det_trg3
     killtrigger det_trg4
     setTextLineTrigger det_trg1 :dis_nadj "That is not an adjacent sector"
     setTextLineTrigger det_trg2 :dis_ndis "You do not have any Mine Disruptors!"
     setTextLineTrigger det_trg3 :dis_done "Disruptor launched into sector"
     setTextLineTrigger det_trg4 :dis_okay "Landing on Federation StarDock."

     # Send macro
     send "qqq  z  n  c  w  y  " & $sector & "  *  *  q  q  z  n  p  s  h "
     pause

     :dis_nadj
     setVar $msg ANSI_10 & "**That sector isn't adjacent to StarDock.*"
     pause

     :dis_ndis
     setVar $msg ANSI_10 & "**Out of disruptors.*"
     pause
 
     :dis_done
     setVar $msg ANSI_10 & "**Disruptor launched!*"
     pause

     :dis_okay
     gosub :do_quickstats
     waitFor "<Hardware Emporium> So what are you looking for (?)"
     killtrigger det_trg1
     killtrigger det_trg2
     killtrigger det_trg3
     killtrigger det_trg4
     echo $msg
     goto :menu_without_clear

elseif ($chosen_option = "B")
     # Get and check input.
     getInput $sector "To sector: "
     isNumber $numtest $sector
     if ($numtest < 1)
           echo ANSI_12 "**Invalid sector number!*"
           goto :menu_without_clear
     end
     if ($sector < 1) OR ($sector > SECTORS)
           echo ANSI_12 "**Invalid sector number!*"
           goto :menu_without_clear
     end

     # Send macro
     send "qqq  z  n  c  v  " & $sector & "*  q  p  s  s "
     waitFor "Landing on Federation StarDock."
     waitFor "<Shipyards> Your option (?)"

elseif ($chosen_option = "C")
     # Get and check input.
     getInput $sector "To sector: "
     isNumber $numtest $sector
     if ($numtest < 1)
           echo ANSI_12 "**Invalid sector number!*"
           goto :menu_without_clear
     end
     if ($sector < 1) OR ($sector > SECTORS)
           echo ANSI_12 "**Invalid sector number!*"
           goto :menu_without_clear
     end

     # Send macro
     send "qqq  z  n  c  v  0  *  y  n  " & $sector & "*  q  p  s  s "
     waitFor "Landing on Federation StarDock."
     waitFor "<Shipyards> Your option (?)"
     goto :print_the_menu

elseif ($chosen_option = "D")
     # Get and check input.
     getInput $sector "To sector: "
     isNumber $numtest $sector
     if ($numtest < 1)
           echo ANSI_12 "**Invalid sector number!*"
           goto :menu_without_clear
     end
     if ($sector < 1) OR ($sector > SECTORS)
           echo ANSI_12 "**Invalid sector number!*"
           goto :menu_without_clear
     end

     # Send macro
     send "qqq  z  n  c  f  *  " & $sector & "  *q  p  s  s "
     waitFor "Landing on Federation StarDock."
     waitFor "<Shipyards> Your option (?)"

elseif ($chosen_option = "E")
     if ($quickstats[GTORP] > 0)
           send "qqq  z  n  u  y  *  .*  z  c  *  p  s  h "
           waitFor "Landing on Federation StarDock."
           gosub :do_quickstats
           waitFor "<Hardware Emporium> So what are you looking for (?)"
     else
           echo ANSI_12 "**You don't have any Genesis Torps!*"
           goto :menu_without_clear
     end

elseif ($chosen_option = "F")
     if ($quickstats[ORE] < 1)
           echo ANSI_12 "**You have no ore to drop!*"
           goto :menu_without_clear
     end

     # Get and check input.
     getInput $pnum "Planet number: "
     isNumber $numtest $pnum
     if ($numtest < 1)
           echo ANSI_12 "**Invalid planet number!*"
           goto :menu_without_clear
     end
     if ($pnum < 1) OR ($pnum > 33000)
           echo ANSI_12 "**Invalid planet number!*"
           goto :menu_without_clear
     end

     # Set the detection triggers
     setVar $msg ""
     killtrigger det_trg1
     killtrigger det_trg2
     killtrigger det_trg3
     killtrigger det_trg4
     killtrigger det_trg5
     setTextLineTrigger det_trg1 :pland_trg_1 "Engage the Autopilot?"
     setTextLineTrigger det_trg2 :pland_trg_2 "That planet is not in this sector."
     setTextLineTrigger det_trg3 :pland_trg_3 "<Take all>"
     setTextLineTrigger det_trg4 :pland_trg_4 "<Take/Leave Products>"
     setTextLineTrigger det_trg5 :pland_trg_5 "Landing on Federation StarDock."

     # Send the macro
     send "qqq  z  n  l  " & $pnum & "  *  *  n  n  *  z  q  t  n  z  l  1  *  q  q  z  n  p  s  h "
     pause

elseif ($chosen_option = "G")
     # Get and check input.
     getInput $pnum "Planet number: "
     isNumber $numtest $pnum
     if ($numtest < 1)
           echo ANSI_12 "**Invalid planet number!*"
           goto :menu_without_clear
     end
     if ($pnum < 1) OR ($pnum > 33000)
           echo ANSI_12 "**Invalid planet number!*"
           goto :menu_without_clear
     end

     # Set the detection triggers
     setVar $msg ""
     killtrigger det_trg1
     killtrigger det_trg2
     killtrigger det_trg3
     killtrigger det_trg4
     killtrigger det_trg5
     setTextLineTrigger det_trg1 :pland_trg_1 "Engage the Autopilot?"
     setTextLineTrigger det_trg2 :pland_trg_2 "That planet is not in this sector."
     setTextLineTrigger det_trg3 :pland_trg_3 "<Take all>"
     setTextLineTrigger det_trg4 :pland_trg_4 "<Take/Leave Products>"
     setTextLineTrigger det_trg5 :pland_trg_5 "Landing on Federation StarDock."

     # Send the macro
     send "qqq  z  n  l  " & $pnum & "  *  *  n  n  *  z  q  a  *  q  q  z  n  p  s  h "
     pause

elseif ($chosen_option = "H")
     if ($quickstats[ATMDT] < 1)
           echo ANSI_12 "**You don't have any Atomic Dets!*"
           goto :menu_without_clear
     end

     # Get and check input.
     getInput $pnum "Planet number: "
     isNumber $numtest $pnum
     if ($numtest < 1)
           echo ANSI_12 "**Invalid planet number!*"
           goto :menu_without_clear
     end
     if ($pnum < 1) OR ($pnum > 33000)
           echo ANSI_12 "**Invalid planet number!*"
           goto :menu_without_clear
     end

     # Set the detection triggers
     setVar $msg ""
     killtrigger det_trg1
     killtrigger det_trg2
     killtrigger det_trg3
     killtrigger det_trg4
     killtrigger det_trg5
     setTextLineTrigger det_trg1 :pland_trg_1 "Engage the Autopilot?"
     setTextLineTrigger det_trg2 :pland_trg_2 "That planet is not in this sector."
     setTextLineTrigger det_trg3 :pland_trg_3 "<Take all>"
     setTextLineTrigger det_trg4 :pland_trg_4 "<Take/Leave Products>"
     setTextLineTrigger det_trg5 :pland_trg_5 "Landing on Federation StarDock."
     setTextLineTrigger det_trg6 :pland_trg_6 "<DANGER> Are you sure you want to do this?"

     # Send the macro
     send "qqq  z  n  l  " & $pnum & "  *  *  n  n  *  z  d  y  p  s  h "
     pause

elseif ($chosen_option = "Z")
     if ($quickstats[CLKS] > 0)
          echo ANSI_11 "*Are you sure you want to cloak out? (y/N)*"
          getConsoleInput $choice singlekey
          upperCase $choice
          if ($choice = "Y")
               goto :cloak_on_out
          else
               echo ANSI_12 & "**Aborting cloak-out.*"
               goto :menu_without_clear
          end
          :cloak_on_out
          send "qqq  y  y"
          goto :lurk
     else
          echo ANSI_12 & "**You have no cloaking devices!*"
     end

elseif ($chosen_option = "L")
     send "qqq  z  n  t  aq  p  s  s "
     waitFor "Landing on Federation StarDock."
     waitFor "<Shipyards> Your option (?)"

elseif ($chosen_option = "T")
     send "qqq  z  n  c  n  9q  q  p  s  s "
     waitFor "Landing on Federation StarDock."
     waitFor "<Shipyards> Your option (?)"

elseif ($chosen_option = "W")
     send "qqq  z  n  c  u  y  q  p  s  s "
     waitFor "Landing on Federation StarDock."
     waitFor "<Shipyards> Your option (?)"

elseif ($chosen_option = "O")
     goto :swap_ore

elseif ($chosen_option = "!")
     echo "[2J"
     send "?"
     halt
else
     echo "[2J"
     send "?"
     goto :lurk
end
goto :menu_without_clear

# -------------------------------------------------------------------
halt
# -------------------------------------------------------------------

:swap_ore
echo "**"
echo ANSI_11 "This automates the process of trading ore between ships.**"
echo ANSI_15 "It pops a planet, drops ore and re-docks.*"
echo ANSI_15 "After a brief pause it then lifts, xports, grabs the ore and re-docks.*"
echo ANSI_15 "The result... you're in your new ship, safe at dock w/ ore.*"
echo ANSI_15 "It tries to be as safe as possible but there's always some risk.*"
echo "*"
echo ANSI_14 "Are you sure you want to start the Ore Swapper X-port? (y/N)*"
getConsoleInput $choice singlekey
upperCase $choice
if ($choice = "Y")
      goto :init_ore_swap_vars
else
      echo ANSI_12 & "**Aborting Ore Swapper X-port.*"
      goto :menu_without_clear
end

# Init vars
:init_ore_swap_vars
setVar $funky_counter 0

# Get and check input
getInput $shipnum "Ship number to transfer fuel to: "
isNumber $numtest $shipnum
if ($numtest < 1)
      echo ANSI_12 "*Invalid ship number!*"
      goto :menu_without_clear
end
if ($shipnum < 1) OR ($shipnum > 65000)
      echo ANSI_12 "*Invalid ship number!*"
      goto :menu_without_clear
end

:top_of_ore_swap
killalltriggers
gosub :do_quickstats
add $funky_counter 1
if ($quickstats[GTORP] < 1)
     echo ANSI_12 "**Out of Genesis Torps. You're going to need one for this.*"
     goto :menu_without_clear
end
if ($quickstats[ORE] < 3)
     echo ANSI_12 "**There's no ore on your ship! You can't drop ore if you don't have any.*"
     goto :menu_without_clear
end

# Lift, pop, re-dock, wait for a beat
send "qqq  z  n  u  y  *  .*  z  c  *  p  s  h "
waitFor "Landing on Federation StarDock."

getRnd $rand_wait 100 300
killtrigger safety_delay 
setDelayTrigger safety_delay :lift_stuff $rand_wait
pause

# Lift, get landing, re-dock, wait for a beat
:lift_stuff
send "qqq  z  n  l*  *  z  q  t  n  z  l  1  *  q  q  z  n  p  s  h "

killtrigger result_trg1
killtrigger result_trg2
killtrigger result_trg3
killtrigger result_trg4
killtrigger result_trg5
setTextLineTrigger result_trg1 :res_torps "You don't have any Genesis Torpedoes to launch!"
setTextLineTrigger result_trg2 :res_nopln "There isn't a planet in this sector."
setTextLineTrigger result_trg3 :res_mltpl "Registry# and Planet Name"
setTextLineTrigger result_trg4 :res_landd "Landing sequence engaged..."
setTextLineTrigger result_trg5 :res_backd "Landing on Federation StarDock."
pause

:res_torps
echo ANSI_12 "**You somehow ran out of Genesis Torps before launching. This should not have happened! Check your status!*"
send "? "
goto :lurk

:res_nopln
echo ANSI_12 "**The planet is gone! Someone might be messing with us.*"
if ($funky_counter < 4)
     goto :top_of_ore_swap
else
     echo ANSI_12 "**I've tried this 3 times, something is definately going on. Check your status!*"
     send "? "
     goto :lurk
end

:res_landd
     waitFor "Planet #"
     getWord CURRENTLINE $pnum 2
     stripText $pnum "#"
     waitFor "(?="
     echo ANSI_10 "**We've landed and dropped our ore on planet #" & $pnum & "!*"
pause

:res_mltpl
     waitFor "--------------------"

     # echo "*Test - Pscanner or multiple*"
     # Muliple planets or a planet scanner... This is never easy.
     killtrigger result_trg1
     killtrigger result_trg2
     killtrigger result_trg3
     killtrigger result_trg4
     killtrigger result_trg5

     setVar $p_array_idx 0
     setArray $p_array 255
     killtrigger plist_trig
     killtrigger plist_end
     setTextLineTrigger plist_trig :plist_line ">"
     setTextLineTrigger plist_end  :plist_end  "Land on which planet"
     pause
     goto :lurk

     :plist_line
     add $p_array_idx 1
     setVar $line CURRENTLINE
     stripText $line "<"
     stripText $line ">"
     getWord $line $a_number 1
     setVar $p_array[$p_array_idx] $a_number
     killtrigger plist_trig
     setTextLineTrigger plist_trig :plist_line "<"

     # echo "*Test - Plist line: " & $a_number & "*"
     pause
     goto :lurk

     :plist_end

     # echo "*Test - Plist end*"

     killtrigger plist_trig
     killtrigger plist_end
     if ($p_array_idx < 1)
          echo ANSI_12 "**The planet is gone! Someone might be messing with us.*"
          if ($funky_counter < 4)
                goto :top_of_ore_swap
          else
                echo ANSI_12 "**I've tried this 3 times, something is definately going on. Check your status!*"
                send "? "
                goto :lurk
          end
     end

     waitFor "Landing on Federation StarDock."
     waitFor "<Hardware Emporium> So what are you looking for (?)"

     getRnd $rand_wait 100 300
     killtrigger safety_delay 
     setDelayTrigger safety_delay :more_lift_stuff $rand_wait
     pause
     :more_lift_stuff

     # Get a random planet number from the list
     getRnd $rnd_idx 1 $p_array_idx
     setVar $pnum $p_array[$rnd_idx]

     # echo "Test - Choosing a num between 1 and " & $p_array_idx & "*"
     # echo "Test - Chosen " & $rnd_idx & " which equals " & $pnum & "*"

     # Set detection triggers
     killtrigger result_trg1
     killtrigger result_trg2
     killtrigger result_trg3
     killtrigger result_trg4
     killtrigger result_trg5
     setTextLineTrigger result_trg1 :res_baddd "Engage the Autopilot?"
     setTextLineTrigger result_trg2 :res_baddd "That planet is not in this sector."
     setTextLineTrigger result_trg3 :res_land2 "<Take/Leave Products>" 
     setTextLineTrigger result_trg4 :res_backd "Landing on Federation StarDock."

     # Send the new macro
     send "qqq  z  n  l  " & $pnum & "  *  *  n  n  *  z  q  t  n  z  l  1  *  q  q  z  n  p  s  h "
     pause

:res_baddd
     killtrigger result_trg1
     killtrigger result_trg2
     killtrigger result_trg3
     killtrigger result_trg4
     killtrigger result_trg5
     echo ANSI_12 "**Our planet is gone! Someone might be messing with us.*"
     if ($funky_counter < 4)
           goto :top_of_ore_swap
     else
           echo ANSI_12 "**I've tried this 3 times, something is definately going on. Check your status!*"
           send "? "
           goto :lurk
     end
goto :lurk

:res_land2
     echo ANSI_10 "**We've landed and dropped our ore on planet #" & $pnum & "!*"
pause

:res_backd
     # Ore has been laid on the planet. Now we can continue.
     killTrigger result_trg1
     killTrigger result_trg2
     killTrigger result_trg3
     killTrigger result_trg4
     killTrigger result_trg5
     killTrigger result_trg6
     killTrigger result_trg7
     killTrigger result_trg8
     killTrigger result_trg9
     killTrigger result_trg0
     gosub :do_quickstats
     waitFor "<Hardware Emporium> So what are you looking for (?)"

     getRnd $rand_wait 100 300
     killtrigger safety_delay 
     setDelayTrigger safety_delay :yet_more_lift_stuff $rand_wait
     pause
     :yet_more_lift_stuff

     # Set result detection triggers
     setVar $msg ""
     setTextLineTrigger result_trg1 :swap_xport_notavail "That is not an available ship."
     setTextLineTrigger result_trg2 :swap_xport_badrange "only has a transport range of"
     setTextLineTrigger result_trg3 :swap_xport_security "SECURITY BREACH! Invalid Password, unable to link transporters."
     setTextLineTrigger result_trg4 :swap_xport_noaccess "Access denied!"
     setTextLineTrigger result_trg5 :swap_xport_xprtgood "Security code accepted, engaging transporter control."
     setTextLineTrigger result_trg6 :swap_pland_noplnet1 "Engage the Autopilot?"
     setTextLineTrigger result_trg7 :swap_pland_noplnet2 "That planet is not in this sector."
     setTextLineTrigger result_trg8 :swap_pland_noplnet3 "Invalid registry number, landing aborted."
     setTextLineTrigger result_trg9 :swap_pland_prodtakn "<Take all>"
     setTextLineTrigger result_trg0 :swap_pland_complete "Landing on Federation StarDock."

     # Lift - xport - land - grab - lift - redock
     send "qqq  z  n  "
     send "x    " & $shipnum & "    *    *    *   "
     send "l  " & $pnum & "  *  *  n  n  *  z  q  a  *  q  q  z  n  "
     send "p  s  h "
     pause

     :swap_xport_notavail
     setVar $msg $msg & ANSI_12 & "*That ship is not available, using the original ship...*"
     pause

     :swap_xport_badrange
     setVar $msg $msg & ANSI_12 & "*That ship is too far away, using the original ship...*"
     pause

     :swap_xport_security
     setVar $msg $msg & ANSI_12 & "*That ship is passworded, using the original ship...*"
     pause

     :swap_xport_noaccess
     setVar $msg $msg & ANSI_12 & "*Cannot access that ship, using the original ship...*"
     pause

     :swap_xport_xprtgood
     setVar $msg $msg & ANSI_10 & "*Xport good!*"
     pause

     :swap_pland_noplnet1
     setVar $msg $msg & ANSI_12 & "*The planet has gone missing. Check your status!*"
     pause

     :swap_pland_noplnet2
     setVar $msg $msg & ANSI_12 & "*The planet has gone missing. Check your status!*"
     pause

     :swap_pland_noplnet3
     setVar $msg $msg & ANSI_12 & "*The planet has gone missing. Check your status!*"
     pause

     :swap_pland_prodtakn
     setVar $msg $msg & ANSI_10 & "*Products collected!*"
     pause

     :swap_pland_complete
     killTrigger result_trg1
     killTrigger result_trg2
     killTrigger result_trg3
     killTrigger result_trg4
     killTrigger result_trg5
     killTrigger result_trg6
     killTrigger result_trg7
     killTrigger result_trg8
     killTrigger result_trg9
     killTrigger result_trg0
     gosub :do_quickstats
     waitFor "<Hardware Emporium> So what are you looking for (?)"
     echo $msg
     goto :menu_without_clear
pause
goto :lurk

# -------------------------------------------------------------------

:pland_trg_1
setVar $msg ANSI_12 & "**There are no planets in the StarDock sector!*"
pause

:pland_trg_2
setVar $msg ANSI_12 & "**That planet is not in the StarDock sector!*"
pause

:pland_trg_3
setVar $msg ANSI_10 & "**Products taken!*"
pause

:pland_trg_4
setVar $msg ANSI_10 & "**Fuel dropped!*"
pause

:pland_trg_6
setVar $msg ANSI_10 & "**Planet destroyed!*"
pause

:pland_trg_5
gosub :do_quickstats
waitFor "<Hardware Emporium> So what are you looking for (?)"
killtrigger det_trg1
killtrigger det_trg2
killtrigger det_trg3
killtrigger det_trg4
killtrigger det_trg5
killtrigger det_trg6
echo $msg
goto :menu_without_clear

# -------------------------------------------------------------------

:do_quickstats
     killtrigger statlinetrig
     setVar $stats ""
     setTextLineTrigger statlinetrig :statsline #179
     send "/"
pause

:statsline
     killtrigger statlinetrig
     setVar $line CURRENTLINE
     replacetext $line #179 " "
     striptext $line ","
     setVar $stats $stats & $line
     getWordPos $line $pos "Ship"
     if ($pos > 0)
          goto :gotStats
     else
          setTextLineTrigger statlinetrig :statsline
     end
pause

:gotStats
     setVar $quickstats[SECT] 0
     setVar $quickstats[TURNS] 0
     setVar $quickstats[CREDS] 0
     setVar $quickstats[FIGS] 0
     setVar $quickstats[SHLDS] 0
     setVar $quickstats[HLDS] 0
     setVar $quickstats[ORE] 0
     setVar $quickstats[ORG] 0
     setVar $quickstats[EQU] 0
     setVar $quickstats[COL] 0
     setVar $quickstats[PHOT] 0
     setVar $quickstats[ARMD] 0
     setVar $quickstats[LMPT] 0
     setVar $quickstats[GTORP] 0
     setVar $quickstats[TWARP] 0
     setVar $quickstats[CLKS] 0
     setVar $quickstats[BEACNS] 0
     setVar $quickstats[ATMDT] 0
     setVar $quickstats[CRBO] 0
     setVar $quickstats[EPRB] 0
     setVar $quickstats[MDIS] 0
     setVar $quickstats[PSPRB] "NO"
     setVar $quickstats[PLSCN] "NO"
     setVar $quickstats[LRS] "NONE"
     setVar $quickstats[ALN] 0
     setVar $quickstats[EXP] 0
     setVar $quickstats[CORP] 0
     setVar $quickstats[SHIP] 0
     setVar $stats $stats & " @@@"
     upperCase $stats
     setVar $current_word 0
     setVar $wordy ""
     while ($wordy <> "@@@")
          if ($wordy = "SECT")
               getWord $stats $quickstats[SECT]   ($current_word + 1)
          elseif ($wordy = "TURNS")
               getWord $stats $quickstats[TURNS]  ($current_word + 1)
          elseif ($wordy = "CREDS")
               getWord $stats $quickstats[CREDS]  ($current_word + 1)
          elseif ($wordy = "FIGS")
               getWord $stats $quickstats[FIGS]   ($current_word + 1)
          elseif ($wordy = "SHLDS")
               getWord $stats $quickstats[SHLDS]  ($current_word + 1)
          elseif ($wordy = "HLDS")
               getWord $stats $quickstats[HLDS]   ($current_word + 1)
          elseif ($wordy = "ORE")
               getWord $stats $quickstats[ORE]    ($current_word + 1)
          elseif ($wordy = "ORG")
               getWord $stats $quickstats[ORG]    ($current_word + 1)
          elseif ($wordy = "EQU")
               getWord $stats $quickstats[EQU]    ($current_word + 1)
          elseif ($wordy = "COL")
               getWord $stats $quickstats[COL]    ($current_word + 1)
          elseif ($wordy = "PHOT")
               getWord $stats $quickstats[PHOT]   ($current_word + 1)
          elseif ($wordy = "ARMD")
               getWord $stats $quickstats[ARMD]   ($current_word + 1)
          elseif ($wordy = "LMPT")
               getWord $stats $quickstats[LMPT]   ($current_word + 1)
          elseif ($wordy = "GTORP")
               getWord $stats $quickstats[GTORP]  ($current_word + 1)
          elseif ($wordy = "TWARP")
               getWord $stats $quickstats[TWARP]  ($current_word + 1)
          elseif ($wordy = "CLKS")
               getWord $stats $quickstats[CLKS]   ($current_word + 1)
          elseif ($wordy = "BEACNS")
               getWord $stats $quickstats[BEACNS] ($current_word + 1)
          elseif ($wordy = "ATMDT")
               getWord $stats $quickstats[ATMDT]  ($current_word + 1)
          elseif ($wordy = "CRBO")
               getWord $stats $quickstats[CRBO]   ($current_word + 1)
          elseif ($wordy = "EPRB")
               getWord $stats $quickstats[EPRB]   ($current_word + 1)
          elseif ($wordy = "MDIS")
               getWord $stats $quickstats[MDIS]   ($current_word + 1)
          elseif ($wordy = "PSPRB")
               getWord $stats $quickstats[PSPRB]  ($current_word + 1)
          elseif ($wordy = "PLSCN")
               getWord $stats $quickstats[PLSCN]  ($current_word + 1)
          elseif ($wordy = "LRS")
               getWord $stats $quickstats[LRS]    ($current_word + 1)
          elseif ($wordy = "ALN")
               getWord $stats $quickstats[ALN]    ($current_word + 1)
          elseif ($wordy = "EXP")
               getWord $stats $quickstats[EXP]    ($current_word + 1)
          elseif ($wordy = "CORP")
               getWord $stats $quickstats[CORP]   ($current_word + 1)
          elseif ($wordy = "SHIP")
               getWord $stats $quickstats[SHIP]   ($current_word + 1)
          end
          add $current_word 1
          getWord $stats $wordy $current_word
     end
return

# -------------------------------------------------------------------
#
# Cloak out
# qqq  y  y
#
# Toggle CN9
# qqq  z  n  c  n  9q  q  p  s  s *
#
# Lift, display sector, re-dock.
# qqq  z  n  dp  s  s *
#
# Lift, holoscan, re-dock
# qqq  z  n  sh*  p  s  s *
#
# Lift, dscan, re-dock
# qqq  z  n  sdp  s  s *
#
# Lift, get xport list, re-dock
# qqq  z  n  x**    p  s  s *
#
# Lift, get planet list, redock
# qqq  z  n  l*  p  s  s *
#
# Check twarp lock (only if twarp 1 or 2)
# qqq  z  n  m  1234  *  yn  *  *  p  s  s *
#
# Twarp out (make sure twarp 1 or 2 exists and ore [>3] exists on ship)
# qqq  z  n  m  1234  *  y  y *
#
# Lift, lock tow and twarp
# qqq  z  n  w  n  *  w  n99*  m  1234  *  y  y *
#
# Lift, xport, re-dock (edit ship #)
# qqq  z  n  x    99    *    *    *    p  s  s *
#
# Lift, launch mine disrupter, re-dock (edit sector #)
# qqq  z  n  c  w  y  1234  *  q  q  q  z  n  p  s  h
#
# Lift, set avoid, re-dock (edit sector #)
# qqq  z  n  c  v  1234*  q  p  s  s *
#
# Lift, clear avoided sector, re-dock (edit sector #)
# qqq  z  n  c  v  0  *  y  n  1234*  q  p  s  s *
#
# Lift, plot course, re-dock (edit sector #)
# qqq  z  n  c  f  *  1234  *q  p  s  s *
#
# Lift, make a planet, re-dock (if torps > 0)
# qqq  z  n  u  y  *  .*  z  c  *  p  s  h *
#
# Lift, land on a planet, drop ore, re-dock (takes pnum, if ore > 0)
# qqq  z  n  l  11  *  *  z  n  z  n  *  z  q  t  n  z  l  1  *  q  q  z  n  p  s  h *
#
# Lift, land on planet, take all, re-dock (takes pnum)
# qqq  z  n  l  11  *  *  z  n  z  n  *  z  q  a  *  q  q  z  n  p  s  h *
#
# Lift, land on planet, destroy planet, re-dock  (takes pnum, if dets > 0)
# qqq  z  n  l  11  *  *  z  n  z  n  *  z  d  y  p  s  h *
#
# -------------------------------------------------------------------
