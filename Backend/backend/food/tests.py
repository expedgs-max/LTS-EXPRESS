from django.test import TestCase
from .models import *
from rest_framework.test import APIClient
from django.urls import reverse
from rest_framework.test import APITestCase
from rest_framework import status
from .serializers import *


# Create your tests here.

# class CommandeParChefBureauTests(TestCase):
#     def setUp(self):
        
#         self.client = APIClient()
#         self.url = reverse('api_get_commande_for_chef')

#         # Create users first
#         self.chef_user = CustomUser.objects.create(
#             username='chef',
#             password='password',
#             role='chef_bureau'
#         )

#         self.client_user = CustomUser.objects.create(
#             username='client1',
#             password='password',
#             first_name='John',
#             last_name='Doe',
#             phone_number_1='1234567890',
#             role='client'
#         )

#         # Create partenaire user before Partenneur
#         self.partenneur1_user = CustomUser.objects.create(
#             username='part1',
#             password='password',
#             role='partener'
#         )

#         # Create Magasin FIRST
#         self.magasin = Magasin.objects.create(
#             owner=Partenneur.objects.create(user=self.partenneur1_user),
#             name="Test Magasin",
#             address="Test Address"
#         )

#         # Now create Livreur with magasin reference
#         self.livreur1 = Livreur.objects.create(
#             partenneur=self.magasin.owner,
#             magasin=self.magasin,
#             wilaya='Test1'
#         )

#         # Then create commands
#         self.commande1 = Commande.objects.create(
#             client=self.client_user,
#             magasin=self.magasin,
#             livreur=self.livreur1,
#             valide_payment=True
#         )
#         self.commande2 = Commande.objects.create(
#                 client=self.client_user,
#                 magasin=self.magasin,
#                 livreur=self.livreur1,
#                 valide_payment=False
#             )

#             # Create another client for filtering tests
#         self.client_user2 = CustomUser.objects.create(
#                 username='client2',
#                 password='password',
#                 first_name='Alice',
#                 last_name='Smith',
#                 phone_number_1='0987654321',
#                 role='client'
#             )
#         self.commande3 = Commande.objects.create(
#                 client=self.client_user2,
#                 magasin=self.magasin,
#                 livreur=self.livreur1
#             )

#             # Create group2 data for negative testing
#         self.partenneur2_user = CustomUser.objects.create(
#                 username='part2',
#                 password='password',
                
#                 role='partennaire'
#             )
#         self.partenneur2 = Partenneur.objects.create(user=self.partenneur2_user)
#         self.livreur2 = Livreur.objects.create(partenneur=self.partenneur2)
#         self.commande4 = Commande.objects.create(
#                 client=self.client_user,
#                 magasin=self.magasin,
#                 livreur=self.livreur2
#             )

#     def test_unauthenticated_access(self):
#         response = self.client.get(self.url)
#         self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

#     def test_non_chef_access(self):
#         user = CustomUser.objects.create(
#             username='regular',
#             password='password',
#             role='client'
#         )
#         self.client.force_authenticate(user=user)
#         response = self.client.get(self.url)
#         self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

#     def test_chef_access_gets_group_commands(self):
#         self.client.force_authenticate(user=self.chef_user)
#         response = self.client.get(self.url)
#         self.assertEqual(response.status_code, status.HTTP_200_OK)
#         self.assertEqual(len(response.data['results']), 3)  # commande1, commande2, commande3
#         self.assertNotIn(self.commande4.id, [c['id'] for c in response.data['results']])

#     def test_filter_by_client_name(self):
#         self.client.force_authenticate(user=self.chef_user)
        
#         # Test first name filter
#         response = self.client.get(self.url, {'client': 'John'})
#         self.assertEqual(len(response.data['results']), 2)
        
#         # Test last name filter
#         response = self.client.get(self.url, {'client': 'Doe'})
#         self.assertEqual(len(response.data['results']), 2)
        
#         # Test phone number filter
#         response = self.client.get(self.url, {'client': '1234567890'})
#         self.assertEqual(len(response.data['results']), 2)

#     def test_filter_by_livreur(self):
#         self.client.force_authenticate(user=self.chef_user)
        
#         # Create another livreur in same group
#         livreur_user = CustomUser.objects.create(
#             username='liv2',
#             password='password',
            
#             role='partennaire'
#         )
#         part = Partenneur.objects.create(user=livreur_user)
#         new_livreur = Livreur.objects.create(partenneur=part)
#         Commande.objects.create(
#             client=self.client_user,
#             magasin=self.magasin,
#             livreur=new_livreur
#         )
        
#         # Filter by livreur first name
#         response = self.client.get(self.url, {'livreur': livreur_user.first_name})
#         self.assertEqual(len(response.data['results']), 1)

#     def test_filter_by_valide_payment(self):
#         self.client.force_authenticate(user=self.chef_user)
        
#         # Test true filter
#         response = self.client.get(self.url, {'valide': 'true'})
#         self.assertEqual(len(response.data['results']), 1)
#         self.assertTrue(response.data['results'][0]['valide_payment'])
        
#         # Test false filter
#         response = self.client.get(self.url, {'valide': 'false'})
#         self.assertEqual(len(response.data['results']), 2)

#     def test_pagination(self):
#         # Create additional commands to test pagination
#         for i in range(15):
#             Commande.objects.create(
#                 client=self.client_user,
#                 magasin=self.magasin,
#                 livreur=self.livreur1
#             )
        
#         self.client.force_authenticate(user=self.chef_user)
#         response = self.client.get(self.url)
#         self.assertEqual(len(response.data['results']), 10)  # Default page size
#         self.assertIsNotNone(response.data['next'])

#     def test_invalid_valide_filter(self):
#         self.client.force_authenticate(user=self.chef_user)
#         response = self.client.get(self.url, {'valide': 'invalid'})
#         self.assertEqual(response.status_code, status.HTTP_200_OK)
#         self.assertEqual(len(response.data['results']), 3)

#     def test_no_results(self):
#         self.client.force_authenticate(user=self.chef_user)
#         response = self.client.get(self.url, {'client': 'NonExisting'})
#         self.assertEqual(len(response.data['results']), 0)

#     def test_related_models_existence(self):
#         self.client.force_authenticate(user=self.chef_user)
#         response = self.client.get(self.url)
#         self.assertIn('client', response.data['results'][0])
#         self.assertIn('magasin', response.data['results'][0])
#         self.assertIn('livreur', response.data['results'][0])

# class CreateCommandeTests(APITestCase):
#     def setUp(self):
#         # Create a client user
#         self.client_user = CustomUser.objects.create(
#             username='client_user',
#             password='password',
#             role='client'
#         )
        
#         # Create a magasin owner (partennaire)
#         self.owner_user = CustomUser.objects.create(
#             username='magasin_owner',
#             password='password',
#             role='partener'
#         )
#         self.partenneur = Partenneur.objects.create(user=self.owner_user)
        
#         # Create a Catlogue instance
#         self.catalogue = Catlogue.objects.create(
#             name="test",
#             description="testetst"
#         )
        
#         # Create an active magasin and associate the Catlogue using the field "cataloguqe"
#         self.magasin = Magasin.objects.create(
#             owner=self.partenneur,
#             name="Test Magasin",
#             address="Test Address",
#             EtatOuverture=True
#         )
#         # Note: We continue using the attribute name "cataloguqe" even though it is misspelled.
#         self.magasin.catalogue.set([self.catalogue]) 
        
#         # Create a closed magasin (if needed for other tests)
#         self.closed_magasin = Magasin.objects.create(
#             owner=self.partenneur,
#             name="Closed Magasin",
#             address="Closed Address",
#             EtatOuverture=False
#         )
        
#         # Create an admin user (for other permission-based tests)
#         self.admin_user = CustomUser.objects.create(
#             username='admin',
#             password='password',
#             role='admin'
#         )
#         print (f"Admin user created: {self.admin_user.username}")
#         print (f"paretnnneur is : {self.partenneur}")
#         print (f"catalogue is {self.catalogue}")
#         print (f"magasin is : {self.magasin}")
        
#         # Reverse the URL for your create_commande endpoint.
#         # Ensure that your urls.py defines a URL named 'create_commande'
#         self.url = reverse('create_commande')

#     def test_unauthenticated_access(self):
#         """
#         Ensure that an unauthenticated POST request to create a commande is forbidden.
#         """
#         response = self.client.post(self.url, {'magasin_id': self.magasin.id}, format='json')
#         self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
# class GetCommandesClientTest(APITestCase):
#     def setUp(self):
#         # Create a client user with the proper role
#         self.client_user = CustomUser.objects.create(
#             username="testclient",
#             password="testpassword",
#             role="client",  # Assuming this value grants IsClient permission
#             phone_number_1="1234567890"
#         )
#         # Log in the user
#         self.client.login(username="testclient", password="testpassword")
        
#         # Create a Magasin instance (minimal fields required)
#         # You may need to create or assign a Partenneur instance to the "owner" field.
#         # For this test, we assume that owner is not validated by the view.
#         from employer.models import Partenneur  # Adjust import as needed
#         owner = Partenneur.objects.create(user=self.client_user)
#         self.magasin = Magasin.objects.create(
#             name="Test Magasin",
#             owner=owner,
#             address="123 Test Street"
#         )
        
#         # Create two Commande objects for the client
#         self.commande1 = Commande.objects.create(
#             client=self.client_user,
#             magasin=self.magasin,
#             total_price=100.00,
#             delivery_price=10.00
#         )
#         self.commande2 = Commande.objects.create(
#             client=self.client_user,
#             magasin=self.magasin,
#             total_price=150.00,
#             delivery_price=15.00
#         )
    
#     def test_get_commandes_client_default_order(self):
#         """
#         Test that GET without 'up' parameter returns commandes ordered by id ascending.
#         """
#         url = reverse("get_commandes_client")  # Adjust URL name as per your urls.py
#         response = self.client.get(url)
#         self.assertEqual(response.status_code, status.HTTP_200_OK)
#         # Assuming pagination returns a "results" key in the response data.
#         results = response.data.get("results", [])
#         self.assertTrue(len(results) >= 2)
#         # Check that the first returned commande has a lower id than the second.
#         self.assertLess(results[0]["id"], results[1]["id"])
    
#     def test_get_commandes_client_descending_order(self):
#         """
#         Test that GET with the 'up' parameter returns commandes ordered by id descending.
#         """
#         url = reverse("get_commandes_client")
#         response = self.client.get(url, {"up": True})
#         self.assertEqual(response.status_code, status.HTTP_200_OK)
#         results = response.data.get("results", [])
#         self.assertTrue(len(results) >= 2)
#         # Check that the first returned commande has a greater id than the second.
#         self.assertGreater(results[0]["id"], results[1]["id"])
    
#     def test_method_not_allowed(self):
#         """
#         Test that a POST request (or any unsupported method) returns a 405 error.
#         """
#         url = reverse("get_commandes_client")
#         response = self.client.post(url)
#         self.assertEqual(response.status_code, status.HTTP_405_METHOD_NOT_ALLOWED)