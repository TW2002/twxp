setvar $line ""
setvar $var 0
send "/"
:info
  killalltriggers
  settextlinetrigger 1 :line #179
  settextlinetrigger 2 :line "Ship "
  settextlinetrigger 3 :done "elp)"
  setdelaytrigger 4 :done 500
  pause
    :line
      setvar $line $line & CURRENTLINE
      goto :info
    :done
      killalltriggers
      replacetext $line #179 " "
      striptext $line ","
      while ($var < 10)
          replacetext $line "  " " "
          add $var 1
        end
# Below, just delete any lines which gathers information that you do not need for your script.
      getword $line $sect 2
      getword $line $turns 4
      getword $line $creds 6
      getword $line $figs 8
      getword $line $shlds 10
      getword $line $hlds 12
      getword $line $ore 14
      getword $line $org 16
      getword $line $equ 18
      getword $line $col 20
      getword $line $phot 21
      if ($phot = "Phot")
          getword $line $phot 22
        else
          setvar $phot ""
        end
      gettext $line $armd "Armd " " Lmpt"
      gettext $line $lmpt "Lmpt " " GTorp"
      gettext $line $gtorp "GTorp " " TWarp"
      gettext $line $twarp "TWarp " " Clks"
      gettext $line $clks "Clks " " Beacns"
      gettext $line $beacns "Beacns " " AtmDt"
      gettext $line $atmdt "AtmDt " " Crbo"
      gettext $line $crbo "Crbo " " EPrb"
      gettext $line $eprb "EPrb " " MDis"
      gettext $line $mdis "MDis " " PsPrb"
      gettext $line $psprb "PsPrb " " PlScn"
      gettext $line $plscn "PlScn " " LRS"
      gettext $line $lrs "LRS " " Aln"
      gettext $line $aln "Aln " " Exp"
      gettext $line $exp "Exp " " Corp"
      if ($exp = "")
          gettext $line $exp "Exp " " Ship"
          setvar $corp 0
        else
          gettext $line $corp "Corp " " Ship"
        end
      if ($phot <> "") and ($corp > 0)
          getword $line $ship1 56
          getword $line $ship2 57
        elseif (($phot = "") and ($corp > 0)) or (($phot <> "") and ($corp = 0))
          getword $line $ship1 54
          getword $line $ship2 55
        elseif ($phot = "") and ($corp = 0)
          getword $line $ship1 52
          getword $line $ship2 53
        end
pause

