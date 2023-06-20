:trim
setVAr $trim 0
getLength $word $wordLen
setVar $backcnt $wordLen
:backcnt
if ($backcnt >= 1)
     cutText $word $letter $backcnt 1
     if ($letter = " ")
          subtract $backcnt 1
          add $trim 1
          goto :backcnt
     end
end
if ($trim > 0)
     setVar $endTrim ($wordLen - $trim)
     cutText $word $word 1 $endTrim
end
return