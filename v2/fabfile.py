from fabric import *

# Default: the staging server
config.fab_hosts = ['anemone.media.mit.edu']
config.code_root = '/srv/commons2/'

def production():
    config.fab_hosts = ['csc-master.media.mit.edu']
    config.code_root = '/srv/commons2/'

virtualenv = 'source $(code_root)/bin/activate'

def run_list(lst):
    run(' && '.join(lst))

def bzr_update(project, develop=True):
    lst = [virtualenv,
           'cd "$(code_root)/%s"' % project,
           'bzr up']
    if develop: lst.append('python setup.py develop')
    run_list(lst)

def update_django():
    run_list([virtualenv,
              'cd $(code_root)/django',
              'svn up',
              'sudo python setup.py install'])
    
def build_media():
    config.tmp_media = 'site_media_tmp'
    config.old_media = 'site_media_old'
    run_list([virtualenv,
              'cd $(code_root)/commons2',
              'rm -rf "$(tmp_media)" "$(old_media)"',
              './manage.py build_media -l --media-root="$(tmp_media)"',
              'mv --no-target-directory site_media $(old_media) || true',
              'mv --no-target-directory $(tmp_media) site_media'])

def restart_webserver():
    sudo('apache2ctl graceful')


def deploy():
    bzr_update('csc-utils')
    bzr_update('conceptnet')
    bzr_update('divisi')
    bzr_update('commons2', develop=False)
    update_django()

    build_media()
    
    restart_webserver()
