cd ..\ptk
cmd /c build-cjs.cmd
cd ..\slink
copy /y ..\ptk\nodebundle.cjs .