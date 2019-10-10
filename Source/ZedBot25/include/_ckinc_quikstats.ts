goto :quikstats_EOF
    # generates variables like  -  $_ckinc_quikstats~quikstats[Clks]

:quikstats
    setVar $completeline ""
    send "/"
:info
    setTextLineTrigger line :line #179
    setTextTrigger doneCommand :done "Command [TL="
    setTextTrigger doneCitadel :done "Citadel command (?=help)"
    pause

:line
    killalltriggers
    setVar $line CURRENTLINE
    replaceText $line #179 " "
    stripText $line ","
    setVar $completeline $completeline & $line
    goto :info

:done
    killalltriggers
    echo "*" & $completeline & "*"
    getWord $completeline $quikstats[Sect] 2
    getWord $completeline $quikstats[Turns] 4
    getWord $completeline $quikstats[Creds] 6
    getWord $completeline $quikstats[Figs] 8
    getWord $completeline $quikstats[Shlds] 10
    getWord $completeline $quikstats[Hlds] 12
    getWord $completeline $quikstats[Ore] 14
    getWord $completeline $quikstats[Org] 16
    getWord $completeline $quikstats[Equ] 18
    getWord $completeline $quikstats[Col] 20
    getWord $completeline $quikstats[Phot] 22
    getWord $completeline $quikstats[Armd] 24
    getWord $completeline $quikstats[Lmpt] 26
    getWord $completeline $quikstats[GTorp] 28
    getWord $completeline $quikstats[TWarp] 30
    getWord $completeline $quikstats[Clks] 32
    getWord $completeline $quikstats[Beacns] 34
    getWord $completeline $quikstats[AtmDt] 36
    getWord $completeline $quikstats[Crbo] 38
    getWord $completeline $quikstats[EPrb] 40
    getWord $completeline $quikstats[MDis] 42
    getWord $completeline $quikstats[PsPrb] 44
    getWord $completeline $quikstats[PlScn] 46
    getWord $completeline $quikstats[LRS] 48
    getWord $completeline $quikstats[Aln] 50
    getWord $completeline $quikstats[Exp] 52
    getWord $completeline $onCorp 53
    if ($onCorp = "Corp")
        getWord $completeline $quikstats[Corp] 54
        getWord $completeline $quikstats[Ship] 56
    else
        setVar $quikstats[Corp] 0
        getWord $completeline $quikstats[Ship] 54
    end

:quikstats_EOF