import os, logging
import cPickle as pickle
from gzip import GzipFile
from django.conf import settings
from stat import ST_MTIME
joinpath = os.path.join

class SVDMissing(Exception):
    should_log = False
    user_visible = True
    http_code = 400 # HTTP Bad request
    
    def __init__(self, lang):
        Exception.__init__(self, 'SVD missing for language %s' % lang)

def tensor_filename(lang):
    return joinpath(settings.TENSOR_ROOT, lang+'_tensor.gz')
def svd_filename(lang):
    return joinpath(settings.TENSOR_ROOT, lang+'_svd')

def get_modification_time(filename):
    return os.stat(filename)[ST_MTIME]

def _cache_load(cache, key, filename):
    if key not in cache: return None

    data, cached_mtime = cache[key]

    # If the file is newer than the cache, the cache is invalid.
    if cached_mtime < get_modification_time(filename): return None

    return data

def _get_cached(cache, key, filename):
    # Try to load from cache
    cached = _cache_load(cache, key, filename)
    if cached is not None:
        logging.info('Cache hit.')
        return cached

    # Get modification time first, to avoid the race condition while loading.
    actual_mtime = get_modification_time(filename)

    # Load
    if filename.endswith('.gz'):
        file = GzipFile(filename, 'rb')
    else:
        file = open(filename, 'rb')

    logging.info('Loading...')
    data = pickle.load(file)

    # Cache the results
    logging.info('Saving to cache.')
    cache[key] = (data, actual_mtime)

    return data

_tensor_cache = {}
_svd_cache = {}

def get_tensor(lang):
    try:
        return _get_cached(_tensor_cache, lang, tensor_filename(lang))
    except OSError:
        raise SVDMissing(lang)

def get_svd_results(lang):
    try:
        return _get_cached(_svd_cache, lang, svd_filename(lang))
    except OSError:
        raise SVDMissing(lang)

#
# Computing the SVD
#
from math import sqrt
IDENTITIES = 3
CUTOFF=3

from csc.conceptnet4.analogyspace import conceptnet_2d_from_db

def run_analogy_space_lang(lang):
    # Load matrix
    logging.info('Loading %s'% lang)
    cnet_2d = conceptnet_2d_from_db(lang, identities=IDENTITIES, cutoff=CUTOFF)
    logging.info('Normalize %r' % cnet_2d)
    cnet_2d = cnet_2d.normalized()

    # Save tensor
    fn = tensor_filename(lang)
    logging.info('Save tensor as %s' % fn)
    pickle.dump(cnet_2d, GzipFile(fn+'_new', 'wb'), -1)
    os.rename(fn+'_new', fn)

    logging.info('Running SVD')
    svd = cnet_2d.svd(k=100)

    # Save SVD
    fn = svd_filename(lang)
    logging.info('Save as %s' % fn)
    pickle.dump(svd, open(fn+'_new', 'wb'), -1)
    os.rename(fn+'_new', fn)
