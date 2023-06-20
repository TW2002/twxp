# phx Sector List Generator v3.2

# -----Set Initial Variables---------------------------------------------------
  getword CURRENTLINE $prompt 1
  setvar $file "SctrLst.txt"
  replacetext $file #32 #95
  setvar $file2 "Refresh"
  setvar $source "01"
  setvar $source2 "Unexplored Sectors"
  setvar $source3 "TWX Dbase"
  setvar $return "No"
  setvar $last ""
  setvar $warps 1
  setvar $name "Specific"
  setvar $sector "11"
  setvar $window "0"

# -----pHx Logo----------------------------------------------------------------
:logo
  echo ANSI_14 "**        .\\            //."
  echo ANSI_14 "*      . \ \          / /."
  echo ANSI_14 "*      .\  ,\    /|_ /,.-"
  echo ANSI_14 "*       -.   \  <^//  ."
  echo ANSI_14 "*       ` -   `-'  \  -"
  echo ANSI_14 "*         '.       /.\`"
  echo ANSI_14 "*            -    .-"
  echo ANSI_14 "*            :`//.'"
  echo ANSI_12 "*   /(        " ANSI_14 ".`.'"
  echo ANSI_12 "*  (((       " ANSI_14 ".' " ANSI_12 " /   /"
  echo ANSI_12 "* (()))    (    ((  ((    \"
  echo ANSI_12 "* (((())   ))  (()) \ \   ))"
  echo ANSI_12 "* (()) " ANSI_14 "p][x scripts" ANSI_12 " ))(( ((*"

# -----Menu--------------------------------------------------------------------
:menu1
  echo ansi_1 "*-" ansi_10 "Sector List Generator v3.2" ansi_1 "-----------------------"
  echo ansi_10 "* (" ansi_9 "S" ansi_10 ")" ansi_9 "ource of List - " ansi_10 $source2 ansi_9 ", " ansi_1 $source3
  if ($source = "06")
      echo ansi_10 "*   (" ansi_9 "1" ansi_10 ")" ansi_9 " Sectors with " ansi_10 $warps ansi_9 " outgoing warps"
    elseif ($source = "07")
      echo ansi_10 "*   (" ansi_9 "1" ansi_10 ") " ansi_10 $stop ansi_9 " hops from sector " ansi_10 $start
    elseif ($source = "16")
      echo ansi_10 "*   (" ansi_9 "1" ansi_10 ")" ansi_9 " Density Range, " ansi_10 $start ansi_9 "-" ansi_10 $stop
    elseif ($source = "09")
      echo ansi_10 "*   (" ansi_9 "1" ansi_10 ")" ansi_9 " Increment Range, " ansi_10 $start ansi_9 "-" ansi_10 $stop
    end
  echo ansi_10 "* (" ansi_9 "L" ansi_10 ")" ansi_9 "ast Line      - " ansi_10 $last
  echo ansi_10 "* (" ansi_9 "F" ansi_10 ")" ansi_9 "ile Handling  - " ansi_10 $file2
  echo ansi_10 "* (" ansi_9 "N" ansi_10 ")" ansi_9 "ame File      - " ansi_10 $name
  echo ansi_10 "* (" ansi_9 "R" ansi_10 ")" ansi_9 "eturn to Menu - " ansi_10 $return
  echo ansi_1 "*-" ansi_10 "(" ansi_9 "Q" ansi_10 ")" ansi_9 "uit " ansi_10 "(" ansi_9 "G" ansi_10 ")" ansi_9 "o" ansi_1 "--------"
  getconsoleinput $menu SINGLEKEY
  uppercase $menu

# -----Menu Response-----------------------------------------------------------
:menu2
  if ($menu = "Q")
      halt
    elseif ($menu = "G")
      goto :launch
    elseif ($menu = "1") and (($source = "06") or ($source = "07") or ($source = "09") or ($source = "16"))
      goto :menu3
    elseif ($menu = "S")
      :getsource
        gosub :sources
        echo ansi_9 "* Where are ya coming from? "
        getconsoleinput $source
        if ($source = "01") or ($source = "02") or ($source = "03") or ($source = "04") or ($source = "06") or ($source = "07") or ($source = "08") or ($source = "15") or ($source = "16") or ($source = "17") or ($source = "18")
            setvar $source3 "TWX Dbase"
          elseif ($source = "05") or ($source = "10") or ($source = "11") or ($source = "14")
            setvar $source3 "CIM"
          elseif ($source = "09")
            setvar $source3 "Script Gen"
          elseif ($source = "12")
            setvar $source3 "Game 'G'"
          elseif ($source = "13")
            setvar $source3 "Game 'CX'"
          end
        if ($source = "01") or ($source = "10")
            setvar $source2 "Unexplored Sectors"
          elseif ($source = "02") or ($source = "11")
            setvar $source2 "Explored Sectors"
          elseif ($source = "03") or ($source = "12")
            setvar $source2 "Corp/Pers Fighters"
          elseif ($source = "04")
            setvar $source2 "Enemy Fighters"
          elseif ($source = "13")
            setvar $source2 "Avoided Sectors"
          elseif ($source = "05")
            setvar $source2 "Warp Display"
          elseif ($source = "14")
            setvar $source2 "Port Report"
          elseif ($source = "06")
            setvar $source2 "# of Outgoing Warps"
            goto :menu306
          elseif ($source = "15")
            setvar $source2 "Sectors w/Back Doors"
          elseif ($source = "07")
            setvar $source2 "Hops from Source"
            goto :menu307
          elseif ($source = "16")
            setvar $source2 "Sectors by Density"
            goto :menu316
          elseif ($source = "08")
            setvar $source2 "Anomolous Sectors"
          elseif ($source = "17")
            setvar $source2 "Sectors w/Planets"
          elseif ($source = "09")
            setvar $source2 "Incremental Listing"
            goto :menu309
          elseif ($source = "18")
            setvar $source2 "Unfigged Deadends"
          else
            echo ansi_12 "** Invalid input, try again."
            goto :getsource
        end
    elseif ($menu = "L")
      :set_last
        echo ansi_10 "* Specify a number to be put at the end of the list "
        getconsoleinput $last
        isnumber $number $last
        if ($last = "")
            goto :menu1
          end
        if ($number = "0")
            echo ansi_12 "** Invalid input, try again."
            goto :set_last
          elseif ($last > SECTORS)
            echo ansi_12 "** That number is to high, try again."
            goto :set_last
          end
    elseif ($menu = "F")
      if ($file2 = "Refresh")
          setvar $file2 "Append"
        elseif ($file2 = "Append")
          setvar $file2 "Refresh"
        end
    elseif ($menu = "R")
      if ($return = "No")
          setvar $return "Yes"
        elseif ($return = "Yes")
          setvar $return "No"
        end
    elseif ($menu = "N")
      if ($name = "Generic")
          setvar $name "Specific"
        elseif ($name = "Specific")
          setvar $name "Generic"
        end
    end
  gosub :warning
  echo "******"
  goto :menu1

# -----SubMenu-----------------------------------------------------------------
:menu3
  if ($source = "06")
      :menu306
        echo ansi_9 "* List all sectors with how many outgoing warps? 1-6 "
        getconsoleinput $warps SINGLEKEY
      if ($warps < 1) or ($warps > 6)
          echo ansi_12 "* That number is out of range"
          goto :menu306
        end
    elseif ($source = "07")
      :menu307
        echo ansi_9 "* What is the base sector? "
        getconsoleinput $start
      if ($start > SECTORS)
          echo ansi_12 "* That number is to high"
          goto :menu307
        end
        echo ansi_9 "* List sectors how many hops away? "
        getconsoleinput $stop
    elseif ($source = "16")
      :menu316
        echo ansi_9 "* Lowest density "
        getconsoleinput $start
        echo ansi_9 "* Highest density "
        getconsoleinput $stop
    elseif ($source = "09")
      :menu309
        echo ansi_9 "* You may use increasing or decreasing values"
        echo ansi_9 "* Starting sector "
        getconsoleinput $start
      :menu309b
        echo ansi_9 "* Stoping sector "
        getconsoleinput $stop
        if ($stop > SECTORS)
            echo ansi_12 "* That number is to high"
            goto :menu309b
          end
    end
  gosub :warning
  goto :menu1

# -----Sector List Sources-----------------------------------------------------
:sources
  echo ansi_10 "** ## " ansi_9 "Choices              " ansi_1 "Source     " ansi_10 " ## " ansi_9 "Choices              " ansi_1 "Source     "
  echo ansi_9 "*-------------------------------------------------------------------------------"
  echo ansi_10 "* 01 " ansi_9 "Unexplored Sectors   " ansi_1 "TWX Dbase  "
  echo ansi_10 " 10 " ansi_9 "Unexplored Sectors   " ansi_1 "CIM"
  echo ansi_10 "* 02 " ansi_9 "Explored Sectors     " ansi_1 "TWX Dbase  "
  echo ansi_10 " 11 " ansi_9 "Explored Sectors     " ansi_1 "CIM"
  echo ansi_10 "* 03 " ansi_9 "Corp/Pers Fighters   " ansi_1 "TWX Dbase  "
  echo ansi_10 " 12 " ansi_9 "Corp/Pers Fighters   " ansi_1 "Game 'G'"
  echo ansi_10 "* 04 " ansi_9 "Enemy Fighters       " ansi_1 "TWX Dbase  "
  echo ansi_10 " 13 " ansi_9 "Avoided Sectors      " ansi_1 "Game 'CX'"
  echo ansi_10 "* 05 " ansi_9 "Warp Display         " ansi_1 "CIM        "
  echo ansi_10 " 14 " ansi_9 "Port Report          " ansi_1 "CIM"
  echo ansi_10 "* 06 " ansi_9 "# of Outgoing Warps  " ansi_1 "TWX Dbase  "
  echo ansi_10 " 15 " ansi_9 "Sectors w/Back Doors " ansi_1 "TWX Dbase"
  echo ansi_10 "* 07 " ansi_9 "Hops from Source     " ansi_1 "TWX Dbase  "
  echo ansi_10 " 16 " ansi_9 "Sectors by Density   " ansi_1 "TWX Dbase"
  echo ansi_10 "* 08 " ansi_9 "Anomolous Sectors    " ansi_1 "TWX Dbase  "
  echo ansi_10 " 17 " ansi_9 "Sectors w/Planets    " ansi_1 "TWX Dbase"
  echo ansi_10 "* 09 " ansi_9 "Incremental Listing  " ansi_1 "Script Gen "
  echo ansi_10 " 18 " ansi_9 "Unfigged Deadends    " ansi_1 "TWX Dbase"
  echo ansi_9 "*-------------------------------------------------------------------------------"
  return
  
# -----Warning about TWX Map Accuracy------------------------------------------
:warning
  if ($source = "07")
      echo ansi_12 "* WARNING: The accuracy of the list you have chosen is dependant on the quality"
      echo ansi_12 "* of your map. For best results you should have a full ZTM or have explored most"
      echo ansi_12 "* or all of the universe."
    end
  return

# -----Script Launch-----------------------------------------------------------
:launch
  if (($source = "05") or ($source = "10") or ($source = "11") or ($source = "12") or ($source = "13") or ($source = "14")) and ($prompt <> "Command")
      echo ansi_12 "* You must start from the command prompt to use that source."
      goto :menu1
    end
  if ($name = "Specific")
      if ($source = "01") or ($source = "10")
          setvar $file GAMENAME & "_SctrLst" & "_unexplored.txt"
        elseif ($source = "02") or ($source = "11")
          setvar $file GAMENAME & "_SctrLst" & "_explored.txt"
        elseif ($source = "03") or ($source = "12")
          setvar $file GAMENAME & "_SctrLst" & "_myFigs.txt"
        elseif ($source = "04")
          setvar $file GAMENAME & "_SctrLst" & "_enemyFigs.txt"
        elseif ($source = "05")
          setvar $file GAMENAME & "_SctrLst" & "_warpDisplay.txt"
        elseif ($source = "06")
          setvar $file GAMENAME & "_SctrLst" & "_" & $warps & "warpsOut.txt"
        elseif ($source = "07")
          setvar $file GAMENAME & "_SctrLst" & "_" & $stop & "from" & $start & ".txt"
        elseif ($source = "08")
          setvar $file GAMENAME & "_SctrLst" & "_anomolous.txt"
        elseif ($source = "09")
          setvar $file "SctrLst_Increment_" & $start & "-" & $stop & ".txt"
        elseif ($source = "13")
          setvar $file GAMENAME & "_SctrLst" & "_avoids.txt"
        elseif ($source = "14")
          setvar $file GAMENAME & "_SctrLst" & "_ports.txt"
        elseif ($source = "15")
          setvar $file GAMENAME & "_SctrLst" & "_backDoored.txt"
        elseif ($source = "16")
          setvar $file GAMENAME & "_SctrLst" & "dens" & $start & "-" & $stop & ".txt"
        elseif ($source = "17")
          setvar $file GAMENAME & "_SctrLst" & "_planets.txt"
        elseif ($source = "18")
          setvar $file GAMENAME & "_SctrLst_unfigged_deadends.txt"
        end
    end
  if ($file2 = "Refresh")
      delete $file
    end
  if ($window = "0")
      window status 70 40 "Sectors" ONTOP
    end
  mergetext $window "*" $window
  setwindowcontents status $window
  if ($source = "01")
      goto :01
    elseif ($source = "02")
      goto :02
    elseif ($source = "03")
      goto :03
    elseif ($source = "04")
      goto :04
    elseif ($source = "05")
      goto :05
    elseif ($source = "06")
      goto :06
    elseif ($source = "07")
      goto :07
    elseif ($source = "08")
      goto :08
    elseif ($source = "09")
      goto :09
    elseif ($source = "10")
      goto :10
    elseif ($source = "11")
      goto :11
    elseif ($source = "12")
      goto :12
    elseif ($source = "13")
      goto :13
    elseif ($source = "14")
      goto :14
    elseif ($source = "15")
      goto :15
    elseif ($source = "16")
      goto :16
    elseif ($source = "17")
      goto :17
    elseif ($source = "18")
      goto :18
    end

# -----Unexplored TWX Dbase----------------------------------------------------
:01
  while ($sector <= SECTORS)
      if (SECTOR.EXPLORED[$sector] = "NO")
          write $file $sector
          gosub :update
        end
      add $sector 1
    end
  goto :end

# -----Explored TWX Dbase------------------------------------------------------
:02
  while ($sector <= SECTORS)
      if (SECTOR.EXPLORED[$sector] = "YES")
          write $file $sector
          gosub :update
        end
      add $sector 1
    end
  goto :end

# -----Personal/Corp Figed Sectors---------------------------------------------
:03
  while ($sector <= SECTORS)
      if (SECTOR.FIGS.OWNER[$sector] = "yours") or (SECTOR.FIGS.OWNER[$sector] = "belong to your Corp")
          write $file $sector
          gosub :update
        end
      add $sector 1
    end
  goto :end

# -----Enemy Figed Sectors-----------------------------------------------------
:04
  while ($sector <= SECTORS)
      if (SECTOR.FIGS.OWNER[$sector] <> "yours") and (SECTOR.FIGS.OWNER[$sector] <> "belong to your Corp") and (SECTOR.FIGS.OWNER[$sector] <> "")
          write $file $sector
          gosub :update
        end
       add $sector 1
    end
  goto :end
  
# -----Corp/Personal Figs TWXDbase---------------------------------------------
:05
  gosub :cim
  send "i"
  goto :multiSectorLines

# -----Sectors w/Specifc # of Outgoing Warps-----------------------------------
:06
  while ($sector <= SECTORS)
      if (SECTOR.WARPCOUNT[$sector] = $warps)
          write $file $sector
          gosub :update
        end
      add $sector 1
    end
  goto :end

# -----Hops From a Source Sector-----------------------------------------------
:07
  setvar $sector 1
  while ($sector <= SECTORS)
      getdistance $warps $start $sector
      if ($warps = $stop)
          write $file $sector
          gosub :update
        end
      add $sector 1
    end
  goto :end

# -----Anomolous Sectors-------------------------------------------------------
:08
  while ($sector <= SECTORS)
      if (SECTOR.ANOMOLY[$sector] = "1")
          write $file $sector
          gosub :update
        end
      add $sector 1
    end
  goto :end
  
# -----Incremental Listing-----------------------------------------------------
:09
  if ($start < $stop)
      while ($start <= $stop)
          write $file $start
          add $start 1
          gosub :update
        end
    elseif ($start > $stop)
      while ($start >= $stop)
          write $file $start
          subtract $start 1
          gosub :update
        end
    end
  goto :end

# -----Unexplored CIM----------------------------------------------------------
:10
  gosub :cim
  send "u"
  goto :multiSectorLines

# -----Explored CIM------------------------------------------------------------
:11
  gosub :cim
  send "e"
  goto :multiSectorLines
  
# -----Corp/Personal Fighters, Game "G"----------------------------------------
:12
  send "g"
  waitfor "Sector    Fighters"
  waitfor "=================="
  goto :singleSectorLines
  
# -----Avoided Sectors---------------------------------------------------------
:13
  send "cx"
  waitfor "<List Avoided Sectors>"
  settexttrigger 1 :avoids
  pause
  :avoids
    goto :multiSectorLines

# -----CIM Port Report---------------------------------------------------------
:14
  gosub :cim
  send "r"
  goto :singleSectorLines

# -----Sectors with Back Doors-------------------------------------------------
:15
  setvar $sector 1
  while ($sector <= SECTORS)
      if (SECTOR.BACKDOORCOUNT[$sector] > 0)
          write $file $sector
          gosub :update
        end
      add $sector 1
    end
  goto :end
  
# -----Sectors by Density Range------------------------------------------------
:16
  setvar $sector 1
  while ($sector <= SECTORS)
      if (SECTOR.DENSITY[$sector] >= $start) and (SECTOR.DENSITY[$sector] <= $stop)
          write $file $sector
          gosub :update
        end
      add $sector 1
    end
  goto :end

# -----Sectors with Planets----------------------------------------------------
:17
  setvar $sector 2
  while ($sector <= SECTORS)
      if (SECTOR.PLANETCOUNT[$sector] > 0)
          write $file $sector
          gosub :update
        end
      add $sector 1
    end
  goto :end

# -----Unfigged Deadends-------------------------------------------------------
:18
  setvar $sector 11
  while ($sector <= SECTORS)
      if (SECTOR.WARPCOUNT[$sector] = 1) and (SECTOR.FIGS.OWNER[$sector] <> "yours") and (SECTOR.FIGS.OWNER[$sector] <> "belong to your Corp")
          write $file $sector
          gosub :update
        end
      add $sector 1
    end
  goto :end

# -----Strip Single Sector Lines-----------------------------------------------
:singleSectorLines
  settextlinetrigger 1 :singleLine
  pause
  :singleLine
    getword CURRENTLINE $sector 1
    getword CURRENTLINE $line 2
    if ($line = "Total")
        goto :end
      elseif ($sector = ":") or ($sector = "") or ($sector = "0")
        send "q"
        goto :end
      end
    write $file $sector
    setvar $sector ""
    gosub :update
    goto :singleSectorLines

# -----Strip Multi Sector Lines------------------------------------------------
:multiSectorLines
  settextlinetrigger 1 :multiLine
  pause
  :multiLine
    setvar $line CURRENTLINE
    if ($line = "")
        send "q"
        goto :end
      end
    mergetext $line "                                                                              " $line
    if ($source = "05")
        cuttext $line $sector 1 5
        gosub :writeMulti
        cuttext $line $sector 7 5
        gosub :writeMulti
        cuttext $line $sector 13 5
        gosub :writeMulti
        cuttext $line $sector 19 5
        gosub :writeMulti
        cuttext $line $sector 25 5
        gosub :writeMulti
        cuttext $line $sector 31 5
        gosub :writeMulti
        cuttext $line $sector 37 5
        gosub :writeMulti
      else
        cuttext $line $sector 3 5
        gosub :writeMulti
        cuttext $line $sector 10 5
        gosub :writeMulti
        cuttext $line $sector 17 5
        gosub :writeMulti
        cuttext $line $sector 24 5
        gosub :writeMulti
        cuttext $line $sector 31 5
        gosub :writeMulti
        cuttext $line $sector 38 5
        gosub :writeMulti
        cuttext $line $sector 45 5
        gosub :writeMulti
        cuttext $line $sector 52 5
        gosub :writeMulti
        cuttext $line $sector 59 5
        gosub :writeMulti
        cuttext $line $sector 66 5
        gosub :writeMulti
        cuttext $line $sector 73 5
        gosub :writeMulti
      end
        setvar $sector ""
        setvar $line ""
        goto :multiSectorLines
  :writeMulti
    if ($source <> "05") and (($sector = "") or ($sector = "     "))
        send "q"
        goto :end
      end
    striptext $sector " "
    if ($source = "05") and ($sector = "")
        return
      end
    write $file $sector
    striptext $window "*"
    add $window 1
    mergetext $window "*" $window
    setwindowcontents status $window
    return

# -----Catch CIM prompt--------------------------------------------------------
:cim
  send "^?"
  waitfor "<Q> Quit"
  settexttrigger 1 :cim2 ":"
  pause
  :cim2
    return

# -----Update Window-----------------------------------------------------------
:update
  striptext $window "*"
  add $window 1
  mergetext $window "*" $window
  setwindowcontents status $window
  return

# -----The End-----------------------------------------------------------------
:end
  striptext $window "*"
  if ($last <> "")
      write $file $last
      add $window 1
    end
  echo ansi_10 "* " $window ansi_9 " sectors recorded."
  if ($window > 0)
      echo ansi_9 "* The file name is: " ansi_10 $file
    else
      echo ansi_12 "* No file created, or file not written to."
    end
  if ($return = "Yes")
      setvar $run 2
      setvar $sector 11
      goto :menu1
    end
  halt
