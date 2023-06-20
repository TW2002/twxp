# ----------------------------------------------------------------
# Information coordinator written by Dnyarri on July 20th, 2005.
# Triggers a scan on ck buydown or ck planet nego.
# Announces limpet tags on subspace.
# Announces when you move a planet
# Can announce photon hits if you change the config var.
# More scripts and info at http://www.navhaz.com
# ----------------------------------------------------------------

setVar $announce_torp 0
echo ANSI_12 "*The coordinator is now active!"
send " * "
waitfor "(?="

:starting_up
killalltriggers
settexttrigger at_cit :at_cit "Citadel command (?=help)"
settexttrigger at_planet :at_planet "Planet command (?=help)"

# Start in no scan mode
:cannot_scan
     killalltriggers
     # Can run scans from either cit or planet prompt.
     settexttrigger at_cit :at_cit "Citadel command (?=help)"
     settexttrigger at_planet :at_planet "Planet command (?=help)"
     settexttrigger no_cby :no_cby "ARE YOU SURE CAPTAIN? (Y/N)"
     settexttrigger no_blind :no_blind "Do you want to make this jump blind?"
     setTextTrigger limpy_tag :limpet_hit "Limpet mine in"
pause

# CK Buydown v. 3.0.2 - buying down using Best Price
# CK Planet Nego exiting --- Done with port
# CK Buydown exiting --- Normal Exit

# At the cit now...
:at_cit

:cit_triggers
     killalltriggers

     # Set no scan triggers and buydown and nego triggers
     settexttrigger computer_prompt  :somewhere_else "Computer command [TL="
     settexttrigger corporate_prompt :somewhere_else "Corporate command [TL="
     settexttrigger command_prompt   :somewhere_else "Command [TL="
     settextlinetrigger buydown_ran :scan_from_cit "Buydown exiting"
     settextlinetrigger buydown_sup :scan_from_cit "(SupGBuydown):"
     settextlinetrigger nego_ran    :scan_from_cit "Planet Nego exiting"
     settextlinetrigger buying_fuel :scan_from_cit "(SupGWorldPTrade):"
     settextlinetrigger cap_trade   :scan_from_cit "CAP Trade, sold units"
     settexttrigger at_planet   :at_planet "Planet command (?=help)"
     settexttrigger no_cby      :no_cby "ARE YOU SURE CAPTAIN? (Y/N)"
     settexttrigger no_blind    :no_blind "Do you want to make this jump blind?"

     # If you're in the cit and move a planet, broadcast it.
     setTextLineTrigger planet_moved :planet_moved "           Planet is now in sector"

     # Set others
     setTextLineTrigger limpy_tag :limpet_hit "Limpet mine in"
     if ($announce_torp <> 0)
          setTextLineTrigger p_wave :photon_wave "Photon Wave Duration : "
          setTextLineTrigger p_ended :photon_ended "Photon Wave Duration has ended in sector"
          setTextLineTrigger p_damage :photon_damage "launched a P-Missile in sector"
     end
pause

# At the planet now...
:at_planet

:planet_triggers
     killalltriggers

     # Set no scan triggers and buydown and nego triggers
     settexttrigger computer_prompt  :somewhere_else "Computer command [TL="
     settexttrigger corporate_prompt :somewhere_else "Corporate command [TL="
     settexttrigger command_prompt   :somewhere_else "Command [TL="
     settextlinetrigger buydown_ran :scan_from_planet "Buydown exiting"
     settextlinetrigger buydown_sup :scan_from_planet "(SupGBuydown):"
     settextlinetrigger nego_ran    :scan_from_planet "Planet Nego exiting"
     settextlinetrigger buying_fuel :scan_from_planet "(SupGWorldPTrade):"
     settextlinetrigger cap_trade   :scan_from_planet "CAP Trade, sold units"
     settexttrigger at_cit   :at_cit "Citadel command (?=help)"
     settexttrigger no_cby   :no_cby "ARE YOU SURE CAPTAIN? (Y/N)"
     settexttrigger no_blind :no_blind "Do you want to make this jump blind?"

     # Set others
     setTextLineTrigger limpy_tag :limpet_hit "Limpet mine in"
     if ($announce_torp <> 0)
          setTextLineTrigger p_wave :photon_wave "Photon Wave Duration : "
          setTextLineTrigger p_ended :photon_ended "Photon Wave Duration has ended in sector"
          setTextLineTrigger p_damage :photon_damage "launched a P-Missile in sector"
     end
pause     


:scan_from_planet
     # Triggered, run scan, reset triggers.
     send " c s* c r*q q "
     killalltriggers
goto :planet_triggers

:scan_from_cit
     # Triggered, run scan, reset triggers.
     send " s* c r*q "
     killalltriggers
goto :cit_triggers


:somewhere_else
     # Left the cit or the planet, just sitting...
     killalltriggers

     # Set others
     settexttrigger no_cby :no_cby "ARE YOU SURE CAPTAIN? (Y/N)"
     settexttrigger no_blind :no_blind "Do you want to make this jump blind?"
     setTextTrigger limpy_tag :limpet_hit "Limpet mine in"
     if ($announce_torp <> 0)
          setTextLineTrigger p_wave :photon_wave "Photon Wave Duration : "
          setTextLineTrigger p_ended :photon_ended "Photon Wave Duration has ended in sector"
          setTextLineTrigger p_damage :photon_damage "launched a P-Missile in sector"
     end
goto :cannot_scan


:limpet_hit
     setVar $line CURRENTLINE
     getWord $line $limp_sector 4
     waitfor "(?="

     :limp_tag
     isNumber $result $limp_sector
     if ($result <> 0)
           send "'Limpet tag in " & $limp_sector & "*"
     end
goto :starting_up


:planet_moved
     setVar $line CURRENTLINE
     getWord $line $move_sector 6
     waitfor "(?="

     :p_moved
     isNumber $result $move_sector
     if ($result <> 0)
           send "'Planet moved to " & $move_sector & "*"
     end
     send " s* "
goto :starting_up


:photon_wave
     setVar $line CURRENTLINE
     getWord $line $duration 5
     getword $line $wave_sector 9
     waitfor "(?="

     :p_wave
     isNumber $result $wave_sector
     if ($result <> 0)
           send "'Photon duration (" & $duration & " seconds) in sector " & $wave_sector & "*"
     end
goto :starting_up


:photon_ended
     setVar $line CURRENTLINE
     getword $line $wave_sector 8
     waitfor "(?="

     :p_ended
     isNumber $result $wave_sector
     if ($result <> 0)
           send "'Photon duration has ended in sector " & $wave_sector & "*"
     end
goto :starting_up


:photon_damage
     setVar $line CURRENTLINE
     getword $line $attacker 1
     getword $line $wave_sector 7
     waitfor "(?="

     :p_damage
     isNumber $result $wave_sector
     if ($result <> 0)
           send "'I was torped by " & $attacker & " in sector " & $wave_sector & "!*"
     end
goto :starting_up

:no_cby
     send " * "
goto :starting_up

:no_blind
     send " * "
goto :starting_up
