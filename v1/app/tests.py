import unittest
from django.test import TestCase
from django.test.client import Client
from csc.corpus.models import User

class SignupTestCase(TestCase):
    def setUp(self):
        pass
    def testSignupPage(self):
        res = self.client.get('/accounts/signup/')
        self.assertEqual(res.status_code, 200)
