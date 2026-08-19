:worldtrade~worldtrade































setvar $move~checksub ":WORLDTRADE~SUB_MOVECHECK"
setvar $worldtrade~credits 0
setvar $worldtrade~checked 0


setvar $gameprefs~bank "WorldTrade"
setvar $gameprefs~animation[$gameprefs~bank] "OFF"
setvar $gameprefs~abortdisplayall[$gameprefs~bank] "OFF"
setvar $gameprefs~screenpauses[$gameprefs~bank] "OFF"
gosub :gameprefs~setgameprefs
:worldtrade~start



if (($worldtrade~credits >= $worldtrade~quota) and ($worldtrade~quota > 0))
  return
end


send "d"
gosub :move~move


goto :START
:worldtrade~sub_movecheck


if ($worldtrade~checked)
  setvar $worldtrade~checked 0
elseif ((SECTOR.FIGS.OWNER[$move~cursector] = "yours") or (SECTOR.FIGS.OWNER[$move~cursector] = "belong to your Corp") or (SECTOR.FIGS.QUANTITY[$move~cursector] = 0))
  setvar $portcheck~sector $move~cursector
  setvar $portcheck~scanned 0
  setvar $portcheck~porttype 1
  gosub :portcheck~portcheck
  setvar $move~noscan $portcheck~scanned

  if ($portcheck~pair > 0)

    setvar $ppt~sectora $move~cursector
    setvar $ppt~sectorb $portcheck~pair
    setvar $ppt~proda $portcheck~tradeproda
    setvar $ppt~prodb $portcheck~tradeprodb
    gosub :ppt~ppt

    if ($ppt~aborted = 0)
      if ($haggle~hagglefactor = 0)
        gosub :playerinfo~infoquick
        setvar $worldtrade~credits $playerinfo~credits
      else
        setvar $worldtrade~credits $haggle~credits
      end

      setvar $move~found 1
    end

    setvar $worldtrade~checked 1
  end
end

return
