# ---------------------------------------------------------
# Casual gridder by Aaron Colman, aaron@ibasics.biz.
#
# This script is released under the GPL on June 8th, 2005
# Go here for the license: http://www.gnu.org/copyleft/gpl.html
#
# This script leaves fighters everywhere you go. Probably will
# want to turn it off if you're running an auto-grid script
# or world trade script. This is for those people that are not
# using any other automated grid script.
#
# Version 1.0 - It handles warping, fedspace, etc. Works in TWX 2.03
# ---------------------------------------------------------

# Get the amount to leave
getinput $number_to_leave "Amount to leave per sector (default=1)?"

# Get owner
echo ANSI_11 "*(C)orporate or (P)ersonal (default = corporate)?*"
getConsoleInput $owned_by SINGLEKEY
upperCase $owned_by

# Get mission
echo ANSI_11  "*(D)efensive, (O)fensive, (T)oll (default = toll)?*"
getConsoleInput $mission SINGLEKEY
upperCase $mission

# Bounds check the number.
isNumber $result $number_to_leave
if ($result = "FALSE")
      setVar $number_to_leave 1
else
      if ($number_to_leave < 1)
            setVar $number_to_leave 1
      end
end

# Bounds check the owner entry.
if ($owned_by = "P")
    setVar $set_owner "P"
else
    setVar $set_owner "C"
end

# Bounds check the mission entry.
if ($mission = "D")
    setVar $ftr_mission "D"
elseif ($mission = "O")
    setVar $ftr_mission "O"
else
    setVar $ftr_mission "T"
end

:sector_wait
    killalltriggers
    setVar $fighters_here 0
    setTextTrigger warp_trigger :auto_warp "Auto Warping to"
    setTextTrigger sector_trigger :just_warped_in "Sector  :"
    setTextTrigger stopped_warp :redisplay_sector "Stop in this sector (Y,N,E,I,R,S,D,P,?) (?=Help) [N] ? Y"
pause

:auto_warp
    # Don't try to do anything on warp...
    setDelayTrigger safety_delay_2 :sector_wait 2000
    waitfor "Warps to Sector(s)"
goto :sector_wait

:redisplay_sector
    send "D"
pause

:just_warped_in
    # Just in case....
    setDelayTrigger safety_delay :sector_wait 2000

    # Escape?
    setTextTrigger enemy_figs :sector_wait "Option?"

    # In FedSpace?
    setTextTrigger fed_trigger :sector_wait "FedSpace, FedLaw Enforced"

    # If there are fighters then we need to know it.
    setTextTrigger fighter_trigger :fighters_yes "Fighters:"

    # Time to decide...
    setTextTrigger nofighter_trigger :lay_figs "Warps to Sector(s) :"
pause

:fighters_yes
   # Warning: This section really doesn't do anything... I could 
   # just move on. I put it here incase I, or someone else, wants to
   # code handling for enemy figs (or redeploy personal into corp).

   # Could be our fighters, corp, or enemy
   setVar $corp_figs 0
   setVar $line CURRENTLINE

   # Are they corp? If so... that's fine.
   getWordPos $line $pos "Corp"
   if ($pos > 0)
         setVar $fighters_here 1
         setVar $corp_figs 1
   end

   # Are they yours? If so, that's fine too...
   getWordPos $line $pos "yours"
   if ($pos > 0)
         setVar $fighters_here 1
   else
      # They're not yours, could be corp tho...
      if ($corp_figs < 1)
            # Not corp, not yours.
            setVar $fighters_here 1

            # Put enemy fig handling here...
      end
   end
# Anyway, fighters are here... do nothing.
goto :sector_wait

:lay_figs
   killalltriggers

   # Just in case
   if ($fighters_here = 0)
        # No fighters in the sector and we just warped in.

        # Set triggers.
        setTextTrigger leave_numb :number_to_leave "Fighters, leaving"
        setTextTrigger ftrs_done :done_leaving "fighter(s) in close support."
        setTextTrigger ftr_error1 :done_leaving "Too many fighters in your fleet!"
        setTextTrigger ftr_error2 :done_leaving "You don't have that many fighters available."

        # Lay fighters
        send "F"
        
        # setDelayTrigger safety_delay :sector_wait 5000
   else
        goto :sector_wait
   end
pause

:number_to_leave
   # Send the number to leave and an enter
   send $number_to_leave "*" $set_owner $ftr_mission
pause

:done_leaving 
   # We're done dealing with this sector. Let us leave.
   # I could put more error handling stuff for other
   # triggers but I'm too lazy...
goto :sector_wait
