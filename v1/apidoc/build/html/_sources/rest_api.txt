ConceptNet 3 REST API
=====================

We are working towards a full RESTful API for ConceptNet 3. Currently,
many read-only database access functions are supported. We also
provide a client library in Python; writing a similar library in
another language should be very easy, as long as it has JSON and URL
retrieval libraries already).

Client Library
--------------

We first describe the client library, which will provide an overview
for the API structure.

The client library can be downloaded at
http://commons.media.mit.edu/media/cnet_client.py and accesses the API
hosted at `Open Mind Commons <http://commons.media.mit.edu/>`_.

The :class:`Concept` class
^^^^^^^^^^^^^^^^^^^^^^^^^^

A `Concept` represents a concept in a particular language. You can
create a Concept like::

    lamp = Concept(language='en', text='lamp')

Since we know something about it, it has an id in the database::

    print 'stem id: %i' % lamp.id    
    
Here is a concept that we don't know anything about::

    florb = Concept('en', 'florbnefter')

so it won't have an id (or anything else)::

    print 'stem id: %s' % florb.id    # (outputs None)

The things we know about lamps are expressed in the form of relations
that have two blanks::

    A dog is a pet.
       ^        ^
    slot 1    slot 2

A forward relation from a concept has that concept in slot 1:

* Something you find in a house is a lamp
* lamps give light
* Something you find on a desktop is lamp

A reverse relation from a concept has that concept in slot 2:

* You are likely to find oil in a lamp.
* You are likely to find a bulb in a lamp.
* shade is part of a lamp.

A Concept can retrieve its list of forward relations::

    fwd_rels = lamp.fwd_relations(limit=5)
    print 'Top 5 forward relations:'
    for rel in fwd_rels:
        # rel is an Assertion. We'll take advantage of its pretty-printer:
        print rel

or reverse relations::

    rev_rels = lamp.rev_relations(limit=5)
    print 'Top 5 reverse relations:'
    for rel in rev_rels:
        print rel

Both :func:`fwd_relations` and :func:`rev_relations` take two optional
parameters:

types
  A list of types of relationships to return, or 'All' (the default)
  to get all relation types. The `list of relation types
  <http://commons.media.mit.deu/en/add/>`_ can be seen on the Open
  Mind Commons website.

limit
  The maximum number of relations to return.
