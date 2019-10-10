#:9_dupescripts~scriptcheck
:scriptcheck
#set array
listActiveScripts $scripts
listActiveScripts $scriptsx
#end load background scripts check for duplicates
:duplicates
setvar $a 1
:duplicates0
while ($a <= $scripts)
setvar $b 1
lowercase $scripts[$a]
lowercase $scriptsx[$a]
while ($b <= $scripts)
lowercase $scriptsx[$b]
if (($a <> $b) and ($scripts[$a] = $scriptsx[$b]))
stop $scripts[$a]
goto :scriptcheck
end
add $b 1
end
add $a 1
end
return