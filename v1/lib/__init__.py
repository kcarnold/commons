# Add this directory to the Python path.
import sys, os.path
_path = os.path.dirname(__file__)
joinpath = os.path.join
sys.path.insert(0, _path)

# Also add stemmer
sys.path.insert(0, joinpath(_path, 'stemmer'))
