#!/bin/bash
while read dir pth; do
    if [ ! -d "$dir" ]; then
	echo Checking out $dir from $pth
	svn co "$pth" "$dir"
    else
	echo Updating $dir
	(cd "$dir" && svn up)
    fi
done <<EOF
lib/django_extensions http://django-command-extensions.googlecode.com/svn/trunk/django_extensions
lib/rosetta      http://django-rosetta.googlecode.com/svn/trunk/rosetta
EOF

# non:
# lib/stemmer      https://svn.media.mit.edu/r/conceptnet3/trunk/PyStemmer-1.0.1
# lib/divisi       https://svn.media.mit.edu/r/divisi/divisi/trunk
# lib/registration http://django-registration.googlecode.com/svn/trunk/registration
