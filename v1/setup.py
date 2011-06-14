#!/usr/bin/env python
from setuptools import setup, find_packages

version_str='0.1'
setup(  name='OpenMindCommons',
        version=version_str,
        description='The Open Mind Commons website',
        author='Kenneth Arnold, Jason Alonso, Rob Speer',
        author_email='conceptnet@media.mit.edu',
        url='http://conceptnet.media.mit.edu/',
        download_url='http://conceptnet.media.mit.edu/ConceptNet-%s.tar.gz' % version_str,
        packages=find_packages(),
#         packages=['commons',
#                   'commons.app',
#                   'commons.public',
#                   'commons.analogy',
#                   ]
        include_package_data=True,
        install_requires=['conceptnet', 'divisi', 'stemmer'],
        )
