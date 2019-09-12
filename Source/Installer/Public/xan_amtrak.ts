# Amtrak fig calculator/checker
# version 1.0 by Xanos 10/19/2005
# for TWXProxy 2.03 Final
# computes sectors to fig,
# optionally checks which are not deployed.
# bugs/feedback to: cosmic_657@yahoo.com

echo ansi_15 "*Amtrak fig calculator 1.0 by Xanos*"
echo "All Fed and MSL sectors must be explored for accurate results.*"
echo "calculating...*"
setvar $file gamename & "_amtrak.txt"
delete $file

# find special ports
setvar $sol 1
setvar $alpha 0
setvar $rylos 0
setvar $s 2
while ($s<=sectors)
  if (port.class[$s]=0)
    if ($alpha=0)
      setvar $alpha $s
    elseif ($rylos=0)
      setvar $rylos $s
    else
      goto :error
    end
  elseif (port.class[$s]=9)
    if ($stardock=0)
      setvar $stardock $s
    else
      goto :error
    end
  end
  add $s 1
end
if ($rylos=0) or ($stardock=0)
  goto :error
end
echo "stardock: " $stardock "*"
echo "class 0's: " $alpha ", " $rylos "*"

# find lanes
setarray $sec sectors
setvar $a $stardock
setvar $b $sol
gosub :lanecalc
setvar $b $alpha
gosub :lanecalc
setvar $b $rylos
gosub :lanecalc
setvar $a $alpha
gosub :lanecalc
setvar $s 2
while ($s<11)
  setvar $sec[$s] 2
  add $s 1
end

# compute figs
setvar $s 1
while ($s<=sectors)
  if ($sec[$s]=2)
    setvar $i 1
    while ($i<=sector.warpcount[$s])
      setvar $t sector.warps[$s][$i]
      if ($sec[$t]<>2)
        setvar $sec[$t] 1
      end
      add $i 1
    end
  end
  add $s 1
end

# output
setvar $s 1
while ($s<=sectors)
  if ($sec[$s]=1)
    write $file $s
  end
  add $s 1
end
echo "sectors to fig are stored in " gamename & "_amtrak.txt*"
echo "would you like to check deployed figs [y/n]? "
getconsoleinput $a [singlekey?]
uppercase $a
if ($a="Y")
  gosub :figscan
  waitfor ")? :"
  echo ansi_15 "*missing figs: "
  setvar $n 0
  setvar $s 11
  while ($s<=sectors)
    if ($sec[$s]=1)
      echo $s " "
      add $n 1
    end
    add $s 1
  end
  if ($n=0)
    echo "none*"
  else
    echo "*total: " $n "*"
  end
end
halt

:lanecalc
getcourse $course $a $b
gosub :lanecalc2
getcourse $course $b $a
:lanecalc2
setvar $i 1
while ($i<=($course+1))
  setvar $sec[$course[$i]] 2
  add $i 1
end
return

:error
echo "problem locating special ports*"
halt

:figscan
send "QQQ*G"
waitfor "Deployed  Fighter  Scan"
waitfor "=="
goto :fignext
:figloop
getword currentline $s 1
getword currentline $x 2
if ($x="Total")
  goto :figdone
end
add $sec[$s] 4
:fignext
settextlinetrigger 0 :figloop
pause
:figdone
return
