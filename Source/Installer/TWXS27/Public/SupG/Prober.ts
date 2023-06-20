# Script Name      : SupGProber
# Author           : SupG
# Description      : Sends out probes, either from a file, randomly, or to unexplored
#                    sectors.  Creates a text file with the results, has a resume option,
#		     also allows for autobuying of probes at Stardock, but can be run elsewhere
#		     in the universe (w/o autobuy of course). Data will be logged in a file by 
#		     the name of <filename.dpr>, random.dpr, or unexplored.dpr
# Trigger Point    : Sector command prompt
# Warnings         : Be fedsafe if running from dock.
# Other            : You are free to modify this script to your liking, but please give me
#                    credit for any of my code that you use.
# Scripter's Tavern : www.scripterstavern.com

setVar $counter 1
setVar $menu_filename "<Enter Filename>"
setVar $menu_One 1
setVar $menu_Two 1
setVar $menu_Three 1
setVar $probecount 1
setVar $auto_buy "OFF"
setVar $keepalivecounter 1
echo "*"
echo ANSI_6 "**   -" ansi_5 "=" ansi_6 "-" ansi_5 "=" ansi_10 "(" ansi_15 "     SupGProber     " ansi_10 ")" ANSI_5 "=" ansi_6 "-" ansi_5 "=" ansi_6 "-*"
echo ANSI_6 "   -" ansi_5 "=" ansi_6 "-" ansi_5 "=" ansi_10 "(" ansi_15 "  www.twtavern.com  " ansi_10 ")" ANSI_5 "=" ansi_6 "-" ansi_5 "=" ansi_6 "-**"

#=-=-=-=--=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-==-=-=-=
:menu

if ($menu_one = 1)
 setVar $menu_method "From File"
elseif ($menu_one = 2)
 setVar $menu_method "Random Sectors"
else
 setVar $menu_method "Unexplored Sectors"
end

if ($menu_two = 1)
 setVar $menu_buy "No"
else
 setVar $menu_buy "Yes"
end

if ($menu_three = 1)
 setVar $menu_resume "No"
else
 setVar $menu_resume "Yes"
end

echo "*"
echo ansi_15 "1 " ansi_8 "- " ansi_7 "Probe Method :             " ansi_7 "- " ansi_15 $menu_method "*"
echo ansi_15 "2 " ansi_8 "- " ansi_7 "Buy Probes from Stardock : " ansi_7 "- " ansi_15 $menu_buy "*"

 if ($menu_One = 1)
  echo ansi_15 "3 " ansi_8 "- " ansi_7 "Resume :                   " ansi_7 "- " ansi_15 $menu_resume "*"
  echo ansi_15 "4 " ansi_8 "- " ansi_7 "Enter Filename :           " ansi_7 "- " ansi_15 $menu_filename "*"
 end
 echo ansi_15 "*C " ansi_8 "- " ansi_7 "Continue"
 getConsoleInput $decisions SINGLEKEY
  if ($decisions = 1)
   add $menu_one 1
    if ($menu_one > 3)
     setVar $menu_one 1
    end
  end
  if ($decisions = 2)
   add $menu_two 1
    if ($menu_two > 2)
     setVar $menu_two 1
    end
  end
  if ($decisions = 3)
   if ($menu_one = 1)
    add $menu_three 1
     if ($menu_three > 2)
      setVar $menu_three 1
     end
   end
  end
  if ($decisions = 4)
   if ($menu_one = 1)
    getInput $menu_filename "Enter Filename : "
   end
  end

#-=-=-=-=-=--=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
if ($decisions = "C")
 
 if ($menu_one = 1)
   setVar $random no
   setVar $unexplored no
   setVar $eprobefilename $menu_filename
   fileExists $Probe_File_exist $eprobefilename
    if ($Probe_File_exist = 0)
      echo "*File not found*"
      goto :menu
    end
   getLength $eprobefilename $File_Length
   subtract $File_length 4
   cutText $eprobefilename $eprobe_tmp 1 $File_length
   mergeText $eprobe_tmp ".tmp" $lastsaved
   mergeText $eprobe_tmp ".dpr" $deadprobefile
    if ($menu_three = 2)
      fileExists $Tmp_File_exists $lastsaved
       if ($Tmp_File_exists = 1)
         read $lastsaved $probecount 1
       else
         echo "*Unable to resume, " $lastsaved " not found. Starting from beginning of file...*"
       end
    end
 end
 
 if ($menu_one = 2)
  setVar $random yes
  setVar $unexplored no
  setVar $deadprobefile "random.dpr"
  getRnd $probe 1 SECTORS
 end

 if ($menu_one = 3)
  setVar $unexplored yes
  setVar $random no
  setVar $probe 1
  setVar $deadprobefile "unexplored.dpr" 
  getInput $probecount "Start Sector"
:procount
  if ($probecount < SECTORS)
     add $probecount 1
	 getSector $probecount $pcountinfo
 	 if ($pcountinfo.explored <> "YES")
 		setVar $probe $probecount
 	 else
  		goto :procount
	 end
  else
    clientmessage "No unexplored Sectors"
    halt
  end	
 end
 
 if ($menu_two = 2)
  setVar $auto_buy "ON"
 end
  goto :go 
else
 goto :menu
end
goto :menu
#-------------------------------------------------------------------
#$deadprobefile = value of the filename where dead probes are logged
#$lastsaved = value of the filename where index of last sector probed is logged
#$probecount = value of the index of the last sector probed
#$probesec[] = value of sector numbers to probe

:go
window progress 200 50 "Progress" yes
:fireprobes
   
   killtrigger 3
   killtrigger 4 
   killtrigger 5
   killtrigger 6
   killtrigger 7
     
      settextlinetrigger 1 :outofprobes "You do not have any Ether Probes."
      settextlinetrigger 2 :continue "SubSpace Ether Probe loaded in launch tube,"
      send "e"
      pause
    :continue
      killtrigger 1
      killtrigger 2
      settextlinetrigger 3 :deadprobe "Probe Destroyed!"
      settextlinetrigger 4 :full_probe "Probe Self Destructs"
      settextlinetrigger 5 :no_route "Error - No route"
      if ($random = no) and ($unexplored = no)
       :readprobefile
	read $eprobefilename $probe_tmp $probecount
       stripText $probe_tmp "("
	   stripText $probe_tmp ")"
	   stripText $probe_tmp "+"
	   getWord $probe_tmp $probe 1
       	   getWord $probe_tmp $depth 2
	if ($probe = "EOF")
         goto :done
       end
	end
      setWindowContents progress "Probing Sector : " & $probe
      send $probe "*"                              
      :enter_sector
      setTextLineTrigger 6 :enter "Probe entering sector :"
      pause
      :enter	
      getword CURRENTLINE $entering_sector 5
      goto :enter_sector
    

:done      
      delete $lastsaved
      echo ANSI_11 "*Done."
      Echo ANSI_11 "*Dead Probes are listed in : " $deadprobefile "*"
      halt
    
#=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
:outofprobes
 killtrigger 2
 if ($menu_one = 1)
  gosub :savepoint
 end
 if ($auto_buy = "ON")
  goto :buy_probes
 else
  echo ANSI_11 "Out of probes.*"
  Echo ANSI_11 "*Dead Probes are listed in : " $deadprobefile "*"
  halt
 end

:deadprobe
 if ($probe = $entering_sector)
  write $deadprobefile $probe
  goto :full_probe
 elseif ($entering_sector = 0)
  mergeText "Problems encountered probing : " $probe $problem
  write $deadprobefile $problem
  goto :full_probe
 else
   send "cv" $entering_sector "*q"
   goto :fireprobes
 end


:no_route
 write $deadprobefile $probe
 send "n"
 goto :full_probe

:full_probe
 if ($random = yes)
  getRnd $probe 1 SECTORS
 elseif ($unexplored = yes)
 :pcount
  if ($probecount < SECTORS)
    add $probecount 1
	 getSector $probecount $pcountinfo
 	 if ($pcountinfo.explored <> "YES")
 		setVar $probe $probecount
 	 else
  		goto :pcount
	 end
  else
    clientmessage "Done, dead probe filed in unexplored.dpr"
	halt
  end
 else
   add $probecount 1
 end  	
 if ($menu_one = 1)
  gosub :savepoint
 end
 goto :fireprobes

#=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
:buy_probes
  setTextTrigger 6 :pause_prompt "[Pause]"
  setTextTrigger 7 :stardock "<StarDock> Where to? (?=Help)"
  send "ps"
  pause

:pause_prompt
 killtrigger 7
 send "*"
 goto :stardock

:stardock
 killtrigger 6
 send "he"
 waitfor "How many Probes do you want"
 getWord CURRENTLINE $num_probes 8
 stripText $num_probes ")"
 if ($num_probes = 0)
  echo ANSI_11 "*Out of probes and credits."  
  Echo ANSI_11 "*Dead Probes are listed in : " $deadprobefile " in your TWX dir*"
  send "*qq"
  halt
 else
  send $num_probes "*qq"
  goto :fireprobes
 end

#=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=  

:savepoint
  delete $lastsaved
  write $lastsaved $probecount
  return
