from rest_framework.test import APITestCase
from rest_framework import status
from django.urls import reverse
from employer.models import *  # Adjust import as needed
import json
from django.utils.timezone import now
from django.contrib.auth.tokens import PasswordResetTokenGenerator
from django.test import TestCase, RequestFactory
from rest_framework.test import APIClient
from food.models import *

from django.test import TestCase, Client
from unittest.mock import patch
from .views import *









class LoginViewTests(APITestCase):
    def setUp(self):
        # Create a test user
        self.user = CustomUser.objects.create_user(
            username='testuser',
            email='testuser@example.com',
            password='testtestT2000'
        )
        # Adjust 'login' to match the name of your login view in urls.py
        self.login_url = reverse('login')

    def test_login_with_valid_credentials(self):
        response = self.client.post(
            self.login_url,
            json.dumps({  # Use json.dumps to convert Python dictionary to JSON string
                'username': 'testuser',
                'password': 'testtestT2000'
            }),
            content_type='application/json'  # Ensure content type is set to application/json
        )

        # Debug response data
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access_token', response.json())

    def test_login_with_invalid_credentials(self):
        response = self.client.post(
            self.login_url,
            json.dumps({  # Use json.dumps to convert Python dictionary to JSON string
                'username': 'testuser',
                'password': 'wrongpassword',
            }),
            content_type='application/json'  # Ensure content type is set to application/json
        )
        self.assertEqual(response.status_code, status.HTTP_406_NOT_ACCEPTABLE)

    def test_login_with_missing_fields(self):
        response = self.client.post(
            self.login_url,
            # Send an empty JSON object if no fields are provided
            json.dumps({}),
            content_type='application/json'  # Ensure content type is set to application/json
        )
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class LogoutViewTests(APITestCase):
    def setUp(self):
        # Setup code for creating a user and generating a refresh token
        self.user = CustomUser.objects.create_user(
            username='testuser',
            email='testuser@example.com',
            password='testpassword'
        )
        self.login_url = reverse('login')  # Adjust based on your login URL
        self.logout_url = reverse('logout')  # Adjust based on your logout URL

        # Authenticate and get access and refresh tokens
        login_response = self.client.post(self.login_url, json.dumps({
            'username': 'testuser',
            'password': 'testpassword'
        }), content_type='application/json')
        self.refresh_token = login_response.json().get('refresh_token')

    def test_logout_with_valid_refresh_token(self):
        response = self.client.post(self.logout_url, json.dumps({
            'refresh_token': self.refresh_token
        }), content_type='application/json')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.json()['detail'], 'Successfully logged out')

    def test_logout_without_refresh_token(self):
        response = self.client.post(
            self.logout_url, {}, content_type='application/json')

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_logout_with_invalid_refresh_token(self):
        invalid_refresh_token = 'invalidtoken123'
        response = self.client.post(self.logout_url, json.dumps({
            'refresh_token': invalid_refresh_token
        }), content_type='application/json')

        self.assertEqual(response.status_code, 500)

    def test_logout_method_not_allowed(self):
        # Trying a GET request instead of POST
        response = self.client.get(self.logout_url)

        self.assertEqual(response.status_code,
                         status.HTTP_405_METHOD_NOT_ALLOWED)
        self.assertEqual(response.json()['detail'], 'Method not allowed')


class ListeUserTests(APITestCase):
    def setUp(self):

        login_response = self.client.post(self.login_url, json.dumps({
            'username': 'smahi',
            'password': 'smahi'
        }), content_type='application/json')
        login_response.json().get('refresh_token')


class ListeUserViewTest(TestCase):
    def setUp(self):
        self.factory = RequestFactory()
        self.client = APIClient()
        self.user = CustomUser.objects.create_user(
            username='testuser',
            password='testpass123',
            role='gestion_commercial',
            wilaya='algiers',
            groupe='group1',
            phone_number_1='1234567890',
            wilaya_code="16"
        )
        self.user2 = CustomUser.objects.create_user(
            username='testuser20000',
            password='testpass123',
            role="zoubir"
        )
        self.url = reverse("litse_user")

    def test_unauthenticated_request(self):
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_authenticated_request_with_invalid_role(self):
        self.client=APIClient()
        self.client.force_authenticate(user=self.user2)
        response = self.client.get(self.url)
        
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(response.json()["detail"],"You do not have permission to perform this action.")
    def test_filter_by_role(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.get(self.url, {'role': 'gestion_commercial'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual((response.data['count']), 1)
        self.assertEqual(response.data['results']
                         [0]["role"], 'gestion_commercial')

    def test_filter_by_wilaya(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.get(
            self.url, {'wilaya_code': '16', "role": "all"})
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        
        self.assertEqual(response.data['results'][0]['wilaya_code'],int(16) )

    def test_filter_by_phone_number(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.get(
            self.url, {'search': '1234567890', 'role': 'all'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual((response.data['count']), 1)
        self.assertEqual(response.data['results']
                         [0]['phone_number_1'], '1234567890')

    def test_pagination(self):
        for i in range(20):
            CustomUser.objects.create_user(username=f'user_{i}')
        self.client.force_authenticate(user=self.user)
        response = self.client.get(self.url, {'role': 'all'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual((response.data['count']), 22)  # Default page size
        self.assertIsNotNone(response.data['next'])

    def test_valid_json(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.get(
            self.url, {'role': 'gestion_commercial'}, content_type='application/json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_exception_handling(self):
        self.client.force_authenticate(user=self.user)
        with self.assertRaises(Exception):
            response = self.client.get(
                self.url, {'role': 'gestion_commercial'})
            raise Exception("Test exception")


class GetALLPartenerViewTest(TestCase):
    def setUp(self):
        self.factory = RequestFactory()
        self.client = APIClient()
        self.user = CustomUser.objects.create_user(
            username='testuser',
            password='testpass123',
            role='centre_appel',
            wilaya='algiers',
            groupe='group1',
            phone_number_1='1234567890'
        )
        self.frobiden_user = CustomUser.objects.create_user(
            username='testuser20000',
            password="testpass123"
        )
        self.url = reverse("get_all_partner")

    def test_unauthenticated_request(self):
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def get_partner_200(self):
        login = self.client.post(reverse("login"), json.dumps({
            "username": "testuser",
            "password": "testpass123"
        }), content_type="application/json")
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {
                                login.json().get('access_token')}")
        resposne = self.client.get(self.url)

        self.assertEqual(resposne.status_code, status.HTTP_200_OK)

    def methode_not_allow(self):
        response = self.client.post(self.url)
        self.assertEqual(response.status_code,
                         status.HTTP_405_METHOD_NOT_ALLOWED)
        self.assertEqual(response.json()['error'], 'method not allowed')


class GetALLPartenerGroupeXViewTest(TestCase):
    def setUp(self):
        self.factory = RequestFactory()
        self.client = APIClient()
        self.user = CustomUser.objects.create_user(
            username='testuser',
            password='testpass123',
            role='centre_appel',
            wilaya='algiers',
            groupe='group1',
            phone_number_1='1234567890'
        )
        self.frobiden_user = CustomUser.objects.create_user(
            username='testuser20000',
            password="testpass123"
        )
        self.url = reverse("get_all_partener_groupe_x")

    def test_unauthenticated_request(self):
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def get_partner_200(self):
        login = self.client.post(reverse("login"), json.dumps({
            "username": "testuser",
            "password": "testpass123"
        }), content_type="application/json")
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {
                                login.json().get('access_token')}")
        resposne = self.client.get(self.url)

        self.assertEqual(resposne.status_code, status.HTTP_200_OK)

    def methode_not_allow(self):
        response = self.client.post(self.url)
        self.assertEqual(response.status_code,
                         status.HTTP_405_METHOD_NOT_ALLOWED)
        self.assertEqual(response.json()['error'], 'method not allowed')


class ListeEmploisPourchefbureuxTESTCase(TestCase):
    def setUp(self):
        self.factory = RequestFactory()
        self.client = APIClient()
        self.user = CustomUser.objects.create_user(
            username='testuser',
            password='testpass123',

            wilaya='algiers',
            groupe='group1',
            phone_number_1='1234567890',
            role="chef_bureau"
        )
        self.frobiden_user = CustomUser.objects.create_user(
            username='testuser20000',
            password="testpass123"
        )
        self.url = reverse("liste_des_employer_par_chef_bureux_x")

    def test_unauthenticated_request(self):
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_permission_role(self):
        self.client.force_authenticate(user=self.frobiden_user)
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_get_login_token(self):
        response = self.client.post(reverse("login"), json.dumps({
            "username": "testuser",
            "password": "testpass123"
        }), content_type="application/json")
        return response.json().get('access_token')

    def test_get_emplois_200(self):
        login_token = self.test_get_login_token()
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {login_token}")
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)


class liste_des_employer_par_chef_bureux_xTestCas(TestCase):
    def setUp(self):
        self.factory = RequestFactory()
        self.client = APIClient()
        self.user = CustomUser.objects.create_user(
            username='testuser',
            password='testpass123',

            wilaya='algiers',
            groupe='group1',
            phone_number_1='1234567890',
            role="chef_bureau"
        )
        self.frobiden_user = CustomUser.objects.create_user(
            username='testuser20000',
            password="testpass123"
        )
        self.url = reverse("liste_des_employer_par_chef_bureux_x")

    def test_unauthenticated_request(self):
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_permission_role(self):
        self.client.force_authenticate(user=self.frobiden_user)
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def get_login(self):
        response = self.client.post(reverse("login"), json.dumps({
            "username": "testuser",
            "password": "testpass123"
        }), content_type="application/json")
        return response.json().get('access_token')

    def test_invalide_token(self):
        login_token = self.get_login()
        self.client.credentials(
            HTTP_AUTHORIZATION=f"Bearer {login_token[:-1]}")
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_get_emplois_200(self):
        login_token = self.get_login()
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {login_token}")
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)


class GetAllCassieComtableTestCase(TestCase):
    def setUp(self):
        self.factory = RequestFactory()
        self.client = APIClient()
        self.user = CustomUser.objects.create_user(
            username='testuser',
            password='testpass123',
            wilaya='algiers',
            role="comptable",
            phone_number_1='1234567890',
        )
        self.frobiden_user = CustomUser.objects.create_user(
            username='testuser20000',
            password="testpass123"
        )
        self.url = reverse("get_all_cassier_comtable")

    def test_unauthenticated_request(self):
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_permission_role(self):
        self.client.force_authenticate(user=self.frobiden_user)
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_get_login(self):
        response = self.client.post(reverse("login"), json.dumps({
            "username": "testuser",
            "password": "testpass123"
        }), content_type="application/json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        return response.json().get('access_token')

    def test_get_cassier_comtable_200(self):
        login_token = self.test_get_login()
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {login_token}")
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)


class ApprouvieCassiesTestCase(TestCase):
    def setUp(self):
        self.factory = RequestFactory()
        self.client = APIClient()
        self.user = CustomUser.objects.create_user(
            username='testuser',
            password='testpass123',
            wilaya='algiers',
            role="comptable",
            phone_number_1='1234567890',
        )

        self.frobiden_user = CustomUser.objects.create_user(
            username='testuser20000',
            password="testpass123"
        )
        self.cassie = Cassie.objects.create(chef_bu=self.frobiden_user)
        print(f"cassie ")
        self.url = reverse("approuvie_la_casse_comptable")

    def test_unauthenticated_request(self):
        response = self.client.post(self.url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def get_login(self):
        response = self.client.post(reverse("login"), json.dumps({
            "username": "testuser",
            "password": "testpass123"
        }), content_type="application/json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        return response.json().get('access_token')

    def test_permission_denied(self):
        self.client.force_authenticate(user=self.frobiden_user)
        response = self.client.post(self.url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_create_and_approve_cassie(self):
        # Create a new cassie
        login_token = self.get_login()
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {login_token}")

        # Approve the created cassie
        approve_response = self.client.patch(self.url, json.dumps(
            {"cassie_id": self.cassie.pk}), content_type="application/json")
        self.assertEqual(approve_response.status_code, status.HTTP_200_OK)

        # Verify the cassie is approved
        cassie = Cassie.objects.get(pk=self.cassie.pk)
        self.assertTrue(cassie.approuve)


class CreateRapportParSuperVisour(TestCase):
    def setUp(self):
        self.factory = RequestFactory()
        self.client = APIClient()
        self.user = CustomUser.objects.create_user(
            username='testuser',
            password='testpass123',
            wilaya='algiers',
            role="superviseur",
            phone_number_1='1234567890',
        )

        self.frobiden_user = CustomUser.objects.create_user(
            username='testuser20000',
            password="testpass123"
        )
        self.url = reverse("create_rapport_supervisseur")
        self.partenneur = Partenneur.objects.create(user=self.frobiden_user)

    def test_unauthenticated_request(self):
        response = self.client.post(self.url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_forbiden_request(self):
        self.client.force_authenticate(user=self.frobiden_user)
        response = self.client.post(self.url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_login_with_super(self):
        response = self.client.post(reverse("login"), json.dumps({
            "username": "testuser",
            "password": "testpass123"
        }), content_type="application/json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        return response.json().get('access_token')

    def test_create_rapport_200(self):
        login_token = self.test_login_with_super()
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {login_token}")

        response = self.client.post(self.url, json.dumps({

        }), content_type="application/json")
        data = {
            "date_rapport": "2022-01-01",
            "parteneur": {"id": self.partenneur.id},
            "message": "test"
        }
        response = self.client.post(self.url, data=json.dumps(
            data), content_type='application/json')

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        return response.json().get('id')

    def test_create_rapport_with_invalidejson(self):
        login_token = self.test_login_with_super()
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {login_token}")
        response = self.client.post(self.url, json.dumps({


        }), content_type="application/json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_rapport_with_invalide_chef_bu(self):
        login_token = self.test_login_with_super()
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {login_token}")
        response = self.client.post(self.url, json.dumps({
            "date_rapport": "2022-01-01",
            "contenu": "test rapport",
            "chef_bu": 1000000000000
        }), content_type="application/json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class ListeRapportParSuperViseurTest(TestCase):
    def setUp(self):
        self.factory = RequestFactory()
        self.client = APIClient()
        self.user = CustomUser.objects.create_user(
            username='testuser',
            password='testpass123',
            wilaya='algiers',
            role="superviseur",
            phone_number_1='1234567890',
        )

        self.frobiden_user = CustomUser.objects.create_user(
            username='testuser20000',
            password="testpass123"
        )
        self.url = reverse("liste_rapport_pour_super")

    def test_unauthenticated_request(self):
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_permission(self):

        login_response = self.client.post(reverse("login"), json.dumps({
            "username": "testuser20000",
            "password": "testpass123"
        }), content_type="application/json")
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {
                                login_response.json().get('access_token')}")
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_login_with_super(self):
        response = self.client.post(reverse("login"), json.dumps({
            "username": "testuser",
            "password": "testpass123"
        }), content_type="application/json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        return response.json().get('access_token')

    def get_liste_with_200(self):
        login_token = self.test_login_with_super()
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {login_token}")
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)


class ResetPasswordTests(APITestCase):
    def setUp(self):
        # Create a test user
        self.user = CustomUser.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='oldpassword'
        )
        self.token_generator = PasswordResetTokenGenerator()
        # Replace with your actual URL name
        self.url = reverse('reset-password')

    def test_reset_password_success(self):
        # Generate a valid token for the user
        token = self.token_generator.make_token(self.user)
        uid = self.user.pk
        new_password = 'newpassword123'

        # Prepare the data
        data = {
            "token": token,
            "uid": uid,
            "new_password": new_password
        }

        # Make the POST request
        response = self.client.post(
            self.url,
            data=json.dumps(data),
            content_type='application/json'
        )

        # Check the response status code and message
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.json(), {
                         "message": "Le mot de passe a été réinitialisé avec succès"})

        # Verify that the password was actually updated
        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password(new_password))

    def test_reset_password_missing_fields(self):
        # Missing 'new_password' field
        data = {
            "token": "sometoken",
            "uid": self.user.pk
        }

        response = self.client.post(
            self.url,
            data=json.dumps(data),
            content_type='application/json'
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.json(), {
                         "message": "lient invalide ou expiré"})

    def test_reset_password_invalid_user(self):
        # Invalid user ID
        data = {
            "token": "sometoken",
            "uid": 9999,  # Non-existent user ID
            "new_password": "newpassword123"
        }

        response = self.client.post(
            self.url,
            data=json.dumps(data),
            content_type='application/json'
        )

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertEqual(response.json(), {
                         "message": "Utilisateur pas valide"})

    def test_reset_password_invalid_token(self):
        # Invalid or expired token
        invalid_token = "invalidtoken"
        uid = self.user.pk
        new_password = "newpassword123"

        data = {
            "token": invalid_token,
            "uid": uid,
            "new_password": new_password
        }

        response = self.client.post(
            self.url,
            data=json.dumps(data),
            content_type='application/json'
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.json(), {
                         "message": "lient invalide ou expiré"})




class VerifieTokenTestCase(TestCase):
    def setUp(self):
        self.factory = RequestFactory()
        self.client = APIClient()
        self.user = CustomUser.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='oldpassword'
        )

        self.token_generator = PasswordResetTokenGenerator()
        self.url = reverse('verify-token')  # Replace with your actual URL name

    def test_valide_token(self):
        token = self.token_generator.make_token(self.user)
        self.ui = self.user.pk
        data = {
            "token": token,
            "uid": self.ui
        }
        response = self.client.post(self.url, data=json.dumps(data),
                                    content_type='application/json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)





class FlexyDemandeTestCase(TestCase):
    def setUp(self):
        self.factory = RequestFactory()
        self.client = APIClient()
        self.user = CustomUser.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='oldpassword',
            role="superviseur"
        )
        self.forbiden = CustomUser.objects.create_user(
            username='testuser20000',
            password="testpass123"
        )
        self.flyxy = Flixy.objects.create(
            superviseur=self.user,
            centre_appel=None,
            somme=14000,
            etat="en_attente"
        )
        
        
        self.url = reverse('demande_flyxsi')  # Replace with your actual URL name
    def test_unauthenticated_request(self):
        response = self.client.post(self.url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
    def test_forbiden_auth (self):
        login_response = self.client.post(reverse("login"), json.dumps({
            "username": "testuser20000",
            "password": "testpass123"
        }), content_type="application/json")
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {login_response.json().get('access_token')}")
        response = self.client.post(self.url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
    # def test_empty_fields (self):
    #     login_response = self.client.post(reverse("login"), json.dumps({
    #         "username": "testuser",
    #         "password": "oldpassword",
            
    #     }), content_type="application/json")
    #     self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {login_response.json().get('access_token')}")
    #     response = self.client.post(self.url, json.dumps({}))
    #     print (f"responseeee isssssss {response.json()}")
    #     self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
    def test_deja_have_flyxy(self):
     login_response = self.client.post(
        reverse("login"),
        json.dumps({
            "username": "testuser",
            "password": "oldpassword"
        }),
        content_type="application/json"
    )
     self.client.credentials(
        HTTP_AUTHORIZATION=f"Bearer {login_response.json().get('access_token')}"
    )
     response = self.client.post(
        self.url,
        json.dumps({
            "somme": 14000.0,  # Use a float value as defined in the model
            "superviseur": self.user.pk,  # Use the primary key of the user
        }),
        content_type="application/json"
    )
     self.assertEqual(response.status_code, 400)
     self.assertEqual(
        response.json(),
        {"message": "Vous avez déjà une demande Flyxy en attente"}
    )
     


class GetDemandesFlixySuperviseurTestCase(APITestCase):
    def setUp(self):
        self.client = APIClient()
        self.supervisor = CustomUser.objects.create_user(
            username='supervisor',
            password='testpass123',
            role='superviseur'
        )
        self.non_supervisor = CustomUser.objects.create_user(
            username='user',
            password='testpass123',
            role='employer'
        )
        self.url = reverse('demmandes_superviseur')
    def test_unauthenticated_request(self):
     response = self.client.get(self.url)
     self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
    def test_forbidden_access(self):
     self.client.force_authenticate(user=self.non_supervisor)
     response = self.client.get(self.url)
     self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
    def test_no_demands_found(self):
     self.client.force_authenticate(user=self.supervisor)
     response = self.client.get(self.url)
     self.assertEqual(response.status_code, status.HTTP_200_OK)
     self.assertEqual(response.data['count'], 0)
     self.assertEqual(response.data['results'], [])
    def test_retrieve_demands(self):
     Flixy.objects.create(superviseur=self.supervisor, somme=1000)
     self.client.force_authenticate(user=self.supervisor)
     response = self.client.get(self.url)
     self.assertEqual(response.status_code, status.HTTP_200_OK)
     self.assertEqual(response.data['count'], 1)
     self.assertEqual(response.data['results'][0]['somme'], 1000)
    def test_filter_by_etat(self):
     Flixy.objects.create(superviseur=self.supervisor, somme=1000, etat='en_attente')
     Flixy.objects.create(superviseur=self.supervisor, somme=2000, etat='approuvé')
     self.client.force_authenticate(user=self.supervisor)
     response = self.client.get(self.url, {'etat': 'en_attente'})
     self.assertEqual(response.status_code, status.HTTP_200_OK)
     self.assertEqual(response.data['count'], 1)
     self.assertEqual(response.data['results'][0]['etat'], 'en_attente')
     import datetime


    #_________prtobleme de package de datetime______________________________
#     def test_filter_by_date(self):
#         date_str = '2024-01-01'
#         Flixy.objects.create(
#     superviseur=self.supervisor,
#     somme=1000,
#     date_de_creation=datetime.datetime(2024, 1, 2, tzinfo=datetime.timezone.utc)
# )
#         Flixy.objects.create(
#     superviseur=self.supervisor,
#     somme=1000,
#     date_de_creation=datetime.datetime(2024, 1, 2, tzinfo=datetime.timezone.utc)
# )
#         self.client.force_authenticate(user=self.supervisor)
#         response = self.client.get(self.url, {'date_de_creation': date_str})
#         self.assertEqual(response.status_code, status.HTTP_200_OK)


        
        
    def test_pagination(self):
     for i in range(25):
        Flixy.objects.create(superviseur=self.supervisor, somme=1000 + i)
     self.client.force_authenticate(user=self.supervisor)
     response = self.client.get(self.url)
     self.assertEqual(len(response.data['results']), 20)  # Default page size
     response = self.client.get(self.url, {'page_size': 10})
     self.assertEqual(len(response.data['results']), 10)
    def test_invalid_method(self):
     self.client.force_authenticate(user=self.supervisor)
     response = self.client.post(self.url)
     self.assertEqual(response.status_code, status.HTTP_405_METHOD_NOT_ALLOWED)
    def test_demands_from_other_supervisors_excluded(self):
     other_supervisor = CustomUser.objects.create_user(
        username='other_supervisor',
        password='testpass123',
        role='superviseur'
    )
     Flixy.objects.create(superviseur=other_supervisor, somme=1000)
     self.client.force_authenticate(user=self.supervisor)
     response = self.client.get(self.url)
     self.assertEqual(response.data['count'], 0)
# class DesactiverAccountTestCase(APITestCase) :
#     def setUp(self):
#         self.client = APIClient()
#         self.user = CustomUser.objects.create_user(
#             username='testuser',
#             password='testpass123',
#             role='chef_bureau'
#         )
#         self.url = reverse('desactiver_accountt')
        
#     def test_unauthenticated_request(self):
#         response = self.client.post(self.url)
#         self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
#     def test_desactivate_user_with_succes(self):
#     # Login to get token
#         login_response = self.client.post(
#             reverse("login"),
#             {"username": "testuser", "password": "testpass123"},  # No need for json.dumps
#             format="json"  # Django REST framework will handle serialization
#         )
#         access_token = login_response.json().get('access_token')
        
#         # Set authorization header
#         self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {access_token}")
        
#         # Send PATCH request to deactivate user
#         response = self.client.patch(
#             reverse('desactiver_account', kwargs={'id': self.user.pk}),
            
#             format='json'
#         )
        
#         # Check response status
#         self.assertEqual(response.status_code, status.HTTP_200_OK)
        
#         # Refresh user instance from database
#         self.user.refresh_from_db()
        
#         # Verify user is deactivated
#         self.assertFalse(self.user.is_active)
class GetChefBureauParWilayaTest(APITestCase):
    def setUp(self):
        # Create sample chef_bureau users with wilaya data.
        # Ensure your CustomUser model supports 'wilaya' and 'wilaya_code' fields.
        self.chef1 = CustomUser.objects.create(
            username="chef1",
            password="testpass",
            role="chef_bureau",
            wilaya="Alger",
            wilaya_code=1
        )
        self.chef2 = CustomUser.objects.create(
            username="chef2",
            password="testpass",
            role="chef_bureau",
            wilaya="Oran",
            wilaya_code=2
        )
        self.chef3 = CustomUser.objects.create(
            username="chef3",
            password="testpass",
            role="chef_bureau",
            wilaya="Alger",
            wilaya_code=1
        )
        # Set the URL for the view (ensure this name exists in your urls.py)
        self.url = reverse("get_chef_bureux_par_wilaya")
    
    def test_get_chef_bureux_par_wilaya_success(self):
        client = APIClient()
        # Force authenticate a user (e.g., chef1)
        client.force_authenticate(user=self.chef1)
        response = client.get(self.url)
        print(f"Response: {response.json()} Status: {response.status_code}")
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json().get("data", [])
        # Expected output: two groups, one for "Alger" with a count of 2 and one for "Oran" with a count of 1.
        expected_data = [
            {'wilaya': "Alger", 'count': 2},
            {'wilaya': "Oran", 'count': 1}
        ]
        self.assertEqual(data, expected_data)
    
    def test_method_not_allowed(self):
        client = APIClient()
        client.force_authenticate(user=self.chef1)
        response = client.post(self.url)
        self.assertEqual(response.status_code, status.HTTP_405_METHOD_NOT_ALLOWED)


class ValidateCoursaParUserGroupeTest(APITestCase):

    def setUp(self):
        # Create a user who meets the Isvtc permission requirements.
        # Adjust attributes as required by your Isvtc permission.
        self.vtc_user = CustomUser.objects.create_user(
            username="vtcuser",
            password="testpass",
            role="validation_vtc",  # or any role that passes Isvtc
            phone_number_1="1234567890"
        )
        
        # Create a Partenneur instance linked to a user.
        # In this example, we re-use the same user for simplicity.
        self.partenaire = Partenneur.objects.create(user=self.vtc_user)
        
        # Create a couple of Coursa instances for the Partenneur.
        self.cours1 = Coursa.objects.create(
            client=self.vtc_user, 
            partener=self.partenaire,
            km=10,
            prix=100,
            wilaya="Alger"
        )
        self.cours2 = Coursa.objects.create(
            client=self.vtc_user, 
            partener=self.partenaire,
            km=15,
            prix=150,
            wilaya="Alger"
        )
        
        self.url = reverse("validate_coursa_par_user_groupe")
        self.client = APIClient()
        self.client.force_authenticate(user=self.vtc_user)

    def test_validate_coursa_success(self):
        """
        Test that a valid POST request updates courses and returns a success message.
        """
        payload = {"id": self.partenaire.pk}
        response = self.client.post(self.url, data=json.dumps(payload), content_type="application/json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        response_data = response.json()
        self.assertEqual(response_data.get("message"), "Validation réussie")
        # The count should equal the number of Coursa instances created (2 in this test)
        self.assertEqual(response_data.get("count"), 2)
        self.assertTrue(response_data.get("success"))
        
        # Verify that the courses are updated (paye=True)
        self.cours1.refresh_from_db()
        self.cours2.refresh_from_db()
        self.assertTrue(self.cours1.paye)
        self.assertTrue(self.cours2.paye)
    
    def test_validate_coursa_no_courses_found(self):
        """
        Test that when no courses are found for the given partenaire,
        the view returns the appropriate message.
        """
        # Remove all courses related to the partenaire
        Coursa.objects.filter(partener=self.partenaire).delete()
        payload = {"id": self.partenaire.pk}
        response = self.client.post(self.url, data=json.dumps(payload), content_type="application/json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        response_data = response.json()
        self.assertEqual(response_data.get("message"), "Aucune course trouvée")
        self.assertFalse(response_data.get("success"))
    
    def test_validate_coursa_missing_chauffeur_id(self):
        """
        Test that if the JSON does not include an 'id', the view returns a 400 error.
        """
        payload = {}  # No "id" provided
        response = self.client.post(self.url, data=json.dumps(payload), content_type="application/json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        response_data = response.json()
        self.assertEqual(response_data.get("message"), "Missing chauffeur_id")
    
    def test_validate_coursa_invalid_json(self):
        """
        Test that invalid JSON in the request body returns a 400 error.
        """
        invalid_json = "this is not json"
        response = self.client.post(self.url, data=invalid_json, content_type="application/json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        response_data = response.json()
        self.assertEqual(response_data.get("message"), "Invalid JSON")
    
    def test_method_not_allowed(self):
        """
        Test that non-POST methods return a 405 error.
        """
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_405_METHOD_NOT_ALLOWED)


class ListeCoursaParGroupeTests(APITestCase):
    def setUp(self):
        # Create a test user and log in.
        self.user = CustomUser.objects.create_user(
            username="testuser", password="TestTest20000", role="validation_vtc", phone_number_1="+213672463630", email="validationvt@gmail.com"
        )
        # Create related Partner and Coursa objects.
        partner_user = CustomUser.objects.create_user(
            username="partneruser", password="partnerpass",
            first_name="John", last_name="Doe", phone_number_1="1234567890", wilaya="Algiers", role="partener"
        )
        self.partner = Partenneur.objects.create(user=partner_user)

        # Create a valid Coursa instance (paye=True)
        self.coursa_valid = Coursa.objects.create(
            partener=self.partner,
            paye=True,
            tax_tawsile=15.0,
            km=1000,
            prix=120,
            client=self.user
        )
        # Create an invalid Coursa instance (paye=False)
        self.coursa_invalid = Coursa.objects.create(
            partener=self.partner,
            paye=False,
            tax_tawsile=5.0,
            km=1200,
            prix=100,
            client=self.user
        )
        self.url = reverse("liste_coursa_par_groupe")

    def test_get_invalid_coursa(self):
        """
        Test that when valide=false (or not true) only non-paid (paye=False)
        coursa are returned.
        """
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)
        response = self.client.get(self.url, {'valide': 'false'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()

        # Check pagination keys exist.
        self.assertIn('data', data)
        self.assertIn('pagination', data)

        # Verify that all returned coursa are not paid.
        for coursa in data['data']:
            self.assertFalse(coursa['paye'])

    def test_get_valid_coursa(self):
        """
        Test that when valide=true only paid (paye=True) coursa are returned.
        """
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)
        response = self.client.get(self.url, {'valide': 'true'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()

        # Verify that all returned coursa are paid.
        for coursa in data['data']:
            self.assertTrue(coursa['paye'])

    def test_filter_by_wilaya(self):
        """
        Test filtering by wilaya.
        """
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)
        response = self.client.get(self.url, {'wilaya': 'alg'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()

        # All returned coursa should have partner's wilaya containing 'alg' (case-insensitive).
        for coursa in data['data']:
            self.assertIn('alg'.lower(), coursa['partener__user__wilaya'].lower())

    def test_filter_by_search(self):
        """
        Test filtering by search parameter on phone number.
        """
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)
        response = self.client.get(self.url, {'search': '1234'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()

        # Check that each returned coursa has a phone number containing the search term.
        for coursa in data['data']:
            self.assertIn('1234', coursa['partener__user__phone_number_1'])

    def test_pagination(self):
        """
        Test that pagination returns correct page info.
        """
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)
        # Request a small page size to force pagination.
        response = self.client.get(self.url, {'page': 1, 'page_size': 1})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()

        # Check pagination information is correct.
        self.assertEqual(data['pagination']['page_size'], 1)
        # Current page should be 1.
        self.assertEqual(data['pagination']['current_page'], 1)



class GetAllPertenneurNoGroupeTests(APITestCase):
    def setUp(self):
        # Create a test centre appel user with the proper permissions.
        # Adjust user creation based on how your IsCentreappel permission is implemented.
        self.centreappel_user = CustomUser.objects.create_user(
            username='centreappel',
            password='testpass',
            is_active=True,
            role='centre_appel'  
        )
        self.client = APIClient()
        self.client.force_authenticate(user=self.centreappel_user)
        
        # Create Partenneur objects that meet the conditions:
        # user__groupe is None, user is inactive, and role is "partener".
        partner_user1 = CustomUser.objects.create_user(
            username='partner1',
            password='testpass',
            is_active=False,
            role='partener'
        )
        self.partenaire1 = Partenneur.objects.create(user=partner_user1)
        
        partner_user2 = CustomUser.objects.create_user(
            username='partner2',
            password='testpass',
            is_active=False,
            role='partener'
        )
        self.partenaire2 = Partenneur.objects.create(user=partner_user2)
        
        # Create some Partenneur objects that should not be counted.
        # Example 1: active user
        partner_user3 = CustomUser.objects.create_user(
            username='partner3',
            password='testpass',
            is_active=True,
            role='partener'
        )
        self.partenaire3 = Partenneur.objects.create(user=partner_user3)
        
        # Example 2: incorrect role
        partner_user4 = CustomUser.objects.create_user(
            username='partner4',
            password='testpass',
            is_active=False,
            role='other'
        )
        self.partenaire4 = Partenneur.objects.create(user=partner_user4)
        
        # Example 3: user with groupe not None.
        partner_user5 = CustomUser.objects.create_user(
            username='partner5',
            password='testpass',
            is_active=False,
            role='partener'
        )
        # Simulate having a groupe by setting the attribute; adjust based on your model.
        partner_user5.groupe = "some_group"
        partner_user5.save()
        self.partenaire5 = Partenneur.objects.create(user=partner_user5)
    
    def test_get_all_pertenneur_no_groupe_get_method(self):
        """
        Test that GET request returns the count of Partenneur objects 
        where the associated user has no groupe, is inactive, and has role 'partener'.
        """
        url = reverse('get_all_pertenneur_no_groupe') 
        self.client=APIClient()
        self.client.force_authenticate(user=self.centreappel_user) # Ensure the URL name matches your configuration.
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        # Only partner1 and partner2 should meet the criteria.
        self.assertEqual(data.get("count"), 2)
    
    def test_invalid_method(self):
        """
        Test that a POST request (or any non-GET method) returns a 405 Method Not Allowed.

        """
        self.client.force_authenticate(user=self.centreappel_user)
        url = reverse('get_all_pertenneur_no_groupe')
        response = self.client.post(url)
        self.assertEqual(response.status_code, 405)
# class GetVersionLastTests(APITestCase):
#     def setUp(self):
#         self.client = APIClient()
#         self.url = reverse('get_version_last')
        
#         # Create two DeviceApp instances with different create_at timestamps
#         self.device1 = DeviceApp.objects.create(
#             # Add other required fields here, e.g., version="1.0.0"
#             create_at=timezone.now()
#         )
#         # Ensure the second instance is created later than the first
#         self.device2 = DeviceApp.objects.create(
#             # Add other required fields here, e.g., version="1.0.1"
#             create_at=timezone.now() + timezone.timedelta(seconds=10)
#         )

#     def test_get_version_last_success(self):
#         """
#         Test that a GET request returns the latest DeviceApp instance.
#         """
#         response = self.client.get(self.url)
#         self.assertEqual(response.status_code, status.HTTP_200_OK)
#         data = response.json()
#         # The view returns a key "data" with serialized device information.
#         self.assertIn("data", data)
        
#         # Verify that the returned device is the latest one (device2).
#         # Adjust the key (e.g., 'version') based on your DeviceAppSerializer output.
#         # For instance, if your serializer includes a "version" field, you might do:
#         # self.assertEqual(data["data"]["version"], "1.0.1")
#         # Here we simply compare the id or create_at if available.
#         self.assertEqual(data["data"].get("id"), self.device2.id)

#     def test_get_version_last_not_found(self):
#         """
#         Test that a GET request returns a 404 status when no DeviceApp exists.
#         """
#         # Remove all DeviceApp objects.
#         DeviceApp.objects.all().delete()
#         response = self.client.get(self.url)
#         self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
#         data = response.json()
#         self.assertIn("message", data)
#         # You might check the exact message if needed:
#         # self.assertEqual(data["message"], "Probleme de connexion")

#     def test_non_get_method(self):
#         """
#         Test that a non-GET request returns a 405 Method Not Allowed.
#         """
#         response = self.client.post(self.url)
#         self.assertEqual(response.status_code, status.HTTP_405_METHOD_NOT_ALLOWED)
#         data = response.json()
#         self.assertIn("message", data)
#         # Optionally, check that the message matches the view's response.
#         # self.assertEqual(data["message"], "Probleme de connexion")
class GetTypePartenerTests(APITestCase):
    def setUp(self):
        # make sure you have a URL pattern named "get_type_partener" in your urls.py
        self.url = reverse('get_type_partener')
        self.client = APIClient()

        # create a user who *is* a partner
        self.partner_user = CustomUser.objects.create_user(username='partner', password='pass123')
        self.type_compte = Type_compte_partener.objects.create(name='gold')
        self.partner = Partenneur.objects.create(
            user=self.partner_user,
            type_compte=self.type_compte
        )

        # create a user who is NOT a partner
        self.non_partner_user = CustomUser.objects.create_user(username='normal', password='pass123')

    def test_unauthenticated_get(self):
        """Should require authentication."""
        resp = self.client.get(self.url)
        self.assertEqual(resp.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_successful_get_returns_type(self):
        """Authenticated partner should get 200 + correct type."""
        self.client=APIClient()
        self.client.force_authenticate(user=self.partner_user)
        resp = self.client.get(self.url)
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(resp.json(), {"type": "gold"})

    def test_authenticated_non_partner_gets_400(self):
        """Authenticated user without Partenneur should get 400."""
        self.client=APIClient()
        self.client.force_authenticate(user=self.non_partner_user)
        resp = self.client.get(self.url)
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(resp.json(), {"message": "Probleme de connexion"})

    def test_wrong_method_returns_405(self):
        """Any non-GET method should return 405."""
        self.client=APIClient()
        self.client.force_authenticate(user=self.partner_user)
        resp = self.client.post(self.url, {})
        self.assertEqual(resp.status_code, status.HTTP_405_METHOD_NOT_ALLOWED)
        # note: your view returns lowercase 'probleme' here
class GetCodeRemiseTests(APITestCase):
    def setUp(self):
        # URL must match the name you give in urls.py
        self.url = reverse('get_code_remise')
        self.client = APIClient()
        
        # Create a “partner” user and attach a Partenneur + Remise
        self.partner_user = CustomUser.objects.create_user(username='partner', password='pass123')
        self.type_compte = Type_compte_partener.objects.create(name='livreur')
        self.partner = Partenneur.objects.create(
            user=self.partner_user,
            type_compte=self.type_compte
        )
        self.remise = Remise.objects.get (
        partenneur=self.partner
        
        )
        
        
        # Create a user without any Remise
        self.non_partner_user = CustomUser.objects.create_user(username='normal', password='pass123')

    def test_unauthenticated_get(self):
        """GET without credentials should be 401."""
        resp = self.client.get(self.url)
        self.assertEqual(resp.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_successful_get_returns_code(self):
        """Authenticated partner with a Remise gets 200 + code."""
        self.client=APIClient()
        self.client.force_authenticate(user=self.partner_user)
        resp = self.client.get(self.url)
        print(f"reposneee of remise is {resp.json()}")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        data = resp.json()
        self.assertIn(resp.json()["data"]["code_invitation"], self.remise.code_invitation)

    def test_authenticated_no_remise_gets_400(self):
        """Authenticated user without a Remise gets 400."""
        self.client=APIClient()
        self.client.force_authenticate(user=self.non_partner_user)
        resp = self.client.get(self.url)
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)
        

    def test_wrong_method_returns_405(self):
        """POST (or any non-GET) returns 405."""
        self.client=APIClient()
        self.client.force_authenticate(user=self.partner_user)
        resp = self.client.post(self.url, {})
        self.assertEqual(resp.status_code, status.HTTP_405_METHOD_NOT_ALLOWED)
        


class RegisterLivreurTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        # assumes you have in urls.py:
        # path('api/register-livreur/', register_livreur, name='register_livreur')
        self.url = reverse('register_livreur')
        # create the “livreur” account type so .get(name__icontains="livreur") succeeds
        self.type_livreur = Type_compte_partener.objects.create(name='livreur')
    
    #________probleme de migrations ___________ a regler plus tard 
    # def test_successful_registration(self):
    #     """POST with valid data should create User, Partenneur, Vihucule, Livreur."""
    #     payload = {
    #         "username": "testlivreur",
    #         "password": "testpass123",
    #         "phone_number_1": "+213672463680",
            
    #         "email": "foo@example.com",
    #         "role":"partener"
    #         # include any other required fields for your CustomUserSerializer,
    #         # e.g. "email": "a@b.com", "first_name": "Foo", etc.
    #     }
    #     resp = self.client.post(
    #         self.url,
    #         data=json.dumps(payload),
    #         content_type='application/json'
    #     )
    #     print (f"responseeeeeeeeeee issssssssssss {resp.json()}")
    #     self.assertEqual(resp.status_code, 200)
        
    #     self.assertEqual(resp.json(), {"message": "livreur enregistré avec succès"})

    #     # verify user was created
        
    #     user = CustomUser.objects.get(username='testlivreur')
    #     # verify Partenneur
    #     part = Partenneur.objects.get(user=user)
    #     self.assertEqual(part.type_compte, self.type_livreur)
    #     # verify Vihucule
    #     veh = Vihucule.objects.get(pk=part.vihucule.pk)
    #     self.assertEqual(veh.type_vehicule, "Moto")
    #     # verify Livreur
    #     Livreur.objects.get(partenneur=part)

    def test_invalid_payload_returns_400(self):
        """POST with missing/invalid fields should return first serializer error."""

        resp = self.client.post(
            self.url,
            data=json.dumps({}),  # empty payload → serializer.is_valid() False
            content_type='application/json'
        )
        self.assertEqual(resp.status_code, 400)
        # error message comes from first field error, e.g. "This field is required."
        self.assertIn('message', resp.json())
        self.assertTrue(isinstance(resp.json()['message'], str))
        self.assertTrue(len(resp.json()['message']) > 0)

    # def test_missing_type_compte_raises_500(self):
    #     Type_compte_partener.objects.all().delete()
    #     payload = {"username": "testlivreur2", "password": "testpass123", "phone_number_1": "+213672463631"}
    #     resp = self.client.post(self.url, data=json.dumps(payload), content_type='application/json')
    #     self.assertEqual(resp.status_code, 500)
    #     self.assertEqual(resp.json().get("message"), "vous avez un problème de connexion, essayez plus tard")

    def test_get_method_not_allowed(self):
            """Any non-POST (e.g. GET) should return 405."""
            resp = self.client.get(self.url)
            self.assertEqual(resp.status_code, 405)




class RegisterChoffeurTests(TestCase):

    def setUp(self):
        # Create a user who meets the Isvtc permission requirements.
        # Adjust attributes as required by your Isvtc permission.
        self.vtc_user = CustomUser.objects.create_user(
            username="vtcuser",
            password="testpass",
            role="validation_vtc",  # or any role that passes Isvtc
            phone_number_1="1234567890"
        )
        
        # Create a Partenneur instance linked to a user.
        # In this example, we re-use the same user for simplicity.
        self.partenaire = Partenneur.objects.create(user=self.vtc_user)
        
        # Create a couple of Coursa instances for the Partenneur.
        self.cours1 = Coursa.objects.create(
            client=self.vtc_user, 
            partener=self.partenaire,
            km=10,
            prix=100,
            wilaya="Alger"
        )
        self.cours2 = Coursa.objects.create(
            client=self.vtc_user, 
            partener=self.partenaire,
            km=15,
            prix=150,
            wilaya="Alger"
        )
        
        self.url = reverse("validate_coursa_par_user_groupe")
        self.client = APIClient()

        self.client.force_authenticate(user=self.vtc_user)

    def test_validate_coursa_success(self):
        """
        Test that a valid POST request updates courses and returns a success message.
        """
        payload = {"id": self.partenaire.pk}
        response = self.client.post(self.url, data=json.dumps(payload), content_type="application/json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        response_data = response.json()
        self.assertEqual(response_data.get("message"), "Validation réussie")
        # The count should equal the number of Coursa instances created (2 in this test)
        self.assertEqual(response_data.get("count"), 2)
        self.assertTrue(response_data.get("success"))
        
        # Verify that the courses are updated (paye=True)
        self.cours1.refresh_from_db()
        self.cours2.refresh_from_db()
        self.assertTrue(self.cours1.paye)
        self.assertTrue(self.cours2.paye)
    
    def test_validate_coursa_no_courses_found(self):
        """
        Test that when no courses are found for the given partenaire,
        the view returns the appropriate message.
        """
        # Remove all courses related to the partenaire
        Coursa.objects.filter(partener=self.partenaire).delete()
        payload = {"id": self.partenaire.pk}
        response = self.client.post(self.url, data=json.dumps(payload), content_type="application/json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        response_data = response.json()
        self.assertEqual(response_data.get("message"), "Aucune course trouvée")
        self.assertFalse(response_data.get("success"))
    
    def test_validate_coursa_missing_chauffeur_id(self):
        """
        Test that if the JSON does not include an 'id', the view returns a 400 error.
        """
        payload = {}  # No "id" provided
        response = self.client.post(self.url, data=json.dumps(payload), content_type="application/json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        response_data = response.json()
        self.assertEqual(response_data.get("message"), "Missing chauffeur_id")
    
    def test_validate_coursa_invalid_json(self):
        """
        Test that invalid JSON in the request body returns a 400 error.
        """
        invalid_json = "this is not json"
        response = self.client.post(self.url, data=invalid_json, content_type="application/json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        response_data = response.json()
        self.assertEqual(response_data.get("message"), "Invalid JSON")
    
    def test_method_not_allowed(self):
        """
        Test that non-POST methods return a 405 error.
        """
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_405_METHOD_NOT_ALLOWED)






class GetAllPertenneurNoGroupeTests(APITestCase):
    def setUp(self):
        # Create a test centre appel user with the proper permissions.
        # Adjust user creation based on how your IsCentreappel permission is implemented.
        self.centreappel_user = CustomUser.objects.create_user(
            username='centreappel',
            password='testpass',
            is_active=True,
            role='centre_appel'  
        )
        self.client = APIClient()
        self.client.force_authenticate(user=self.centreappel_user)
        
        # Create Partenneur objects that meet the conditions:
        # user__groupe is None, user is inactive, and role is "partener".
        partner_user1 = CustomUser.objects.create_user(
            username='partner1',
            password='testpass',
            is_active=False,
            role='partener'
        )
        self.partenaire1 = Partenneur.objects.create(user=partner_user1)
        
        partner_user2 = CustomUser.objects.create_user(
            username='partner2',
            password='testpass',
            is_active=False,
            role='partener'
        )
        self.partenaire2 = Partenneur.objects.create(user=partner_user2)
        
        # Create some Partenneur objects that should not be counted.
        # Example 1: active user
        partner_user3 = CustomUser.objects.create_user(
            username='partner3',
            password='testpass',
            is_active=True,
            role='partener'
        )
        self.partenaire3 = Partenneur.objects.create(user=partner_user3)
        
        # Example 2: incorrect role
        partner_user4 = CustomUser.objects.create_user(
            username='partner4',
            password='testpass',
            is_active=False,
            role='other'
        )
        self.partenaire4 = Partenneur.objects.create(user=partner_user4)
        
        # Example 3: user with groupe not None.
        partner_user5 = CustomUser.objects.create_user(
            username='partner5',
            password='testpass',
            is_active=False,
            role='partener'
        )
        # Simulate having a groupe by setting the attribute; adjust based on your model.
        partner_user5.groupe = "some_group"
        partner_user5.save()
        self.partenaire5 = Partenneur.objects.create(user=partner_user5)
    
    def test_get_all_pertenneur_no_groupe_get_method(self):
        """
        Test that GET request returns the count of Partenneur objects 
        where the associated user has no groupe, is inactive, and has role 'partener'.
        """
        url = reverse('get_all_pertenneur_no_groupe') 
        self.client=APIClient()
        self.client.force_authenticate(user=self.centreappel_user) # Ensure the URL name matches your configuration.
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        # Only partner1 and partner2 should meet the criteria.
        self.assertEqual(data.get("count"), 2)
    
    def test_invalid_method(self):
        """
        Test that a POST request (or any non-GET method) returns a 405 Method Not Allowed.

        """
        self.client.force_authenticate(user=self.centreappel_user)
        url = reverse('get_all_pertenneur_no_groupe')
        response = self.client.post(url)
        self.assertEqual(response.status_code, 405)
# class GetVersionLastTests(APITestCase):
#     def setUp(self):
#         self.client = APIClient()
#         self.url = reverse('get_version_last')
        
#         # Create two DeviceApp instances with different create_at timestamps
#         self.device1 = DeviceApp.objects.create(
#             # Add other required fields here, e.g., version="1.0.0"
#             create_at=timezone.now()
#         )
#         # Ensure the second instance is created later than the first
#         self.device2 = DeviceApp.objects.create(
#             # Add other required fields here, e.g., version="1.0.1"
#             create_at=timezone.now() + timezone.timedelta(seconds=10)
#         )

#     def test_get_version_last_success(self):
#         """
#         Test that a GET request returns the latest DeviceApp instance.
#         """
#         response = self.client.get(self.url)
#         self.assertEqual(response.status_code, status.HTTP_200_OK)
#         data = response.json()
#         # The view returns a key "data" with serialized device information.
#         self.assertIn("data", data)
        
#         # Verify that the returned device is the latest one (device2).
#         # Adjust the key (e.g., 'version') based on your DeviceAppSerializer output.
#         # For instance, if your serializer includes a "version" field, you might do:
#         # self.assertEqual(data["data"]["version"], "1.0.1")
#         # Here we simply compare the id or create_at if available.
#         self.assertEqual(data["data"].get("id"), self.device2.id)

#     def test_get_version_last_not_found(self):
#         """
#         Test that a GET request returns a 404 status when no DeviceApp exists.
#         """
#         # Remove all DeviceApp objects.
#         DeviceApp.objects.all().delete()
#         response = self.client.get(self.url)
#         self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
#         data = response.json()
#         self.assertIn("message", data)
#         # You might check the exact message if needed:
#         # self.assertEqual(data["message"], "Probleme de connexion")

#     def test_non_get_method(self):
#         """
#         Test that a non-GET request returns a 405 Method Not Allowed.
#         """
#         response = self.client.post(self.url)
#         self.assertEqual(response.status_code, status.HTTP_405_METHOD_NOT_ALLOWED)
#         data = response.json()
#         self.assertIn("message", data)
#         # Optionally, check that the message matches the view's response.
#         # self.assertEqual(data["message"], "Probleme de connexion")
class GetTypePartenerTests(APITestCase):
    def setUp(self):
        # make sure you have a URL pattern named "get_type_partener" in your urls.py
        self.url = reverse('get_type_partener')
        self.client = APIClient()

        # create a user who *is* a partner
        self.partner_user = CustomUser.objects.create_user(username='partner', password='pass123')
        self.type_compte = Type_compte_partener.objects.create(name='gold')
        self.partner = Partenneur.objects.create(
            user=self.partner_user,
            type_compte=self.type_compte
        )

        # create a user who is NOT a partner
        self.non_partner_user = CustomUser.objects.create_user(username='normal', password='pass123')

    def test_unauthenticated_get(self):
        """Should require authentication."""
        resp = self.client.get(self.url)
        self.assertEqual(resp.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_successful_get_returns_type(self):
        """Authenticated partner should get 200 + correct type."""
        self.client=APIClient()
        self.client.force_authenticate(user=self.partner_user)
        resp = self.client.get(self.url)
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(resp.json(), {"type": "gold"})

    def test_authenticated_non_partner_gets_400(self):
        """Authenticated user without Partenneur should get 400."""
        self.client=APIClient()
        self.client.force_authenticate(user=self.non_partner_user)
        resp = self.client.get(self.url)
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(resp.json(), {"message": "Probleme de connexion"})

    def test_wrong_method_returns_405(self):
        """Any non-GET method should return 405."""
        self.client=APIClient()
        self.client.force_authenticate(user=self.partner_user)
        resp = self.client.post(self.url, {})
        self.assertEqual(resp.status_code, status.HTTP_405_METHOD_NOT_ALLOWED)
        # note: your view returns lowercase 'probleme' here
class GetCodeRemiseTests(APITestCase):
    def setUp(self):
        # URL must match the name you give in urls.py
        self.url = reverse('get_code_remise')
        self.client = APIClient()
        
        # Create a “partner” user and attach a Partenneur + Remise
        self.partner_user = CustomUser.objects.create_user(username='partner', password='pass123')
        self.type_compte = Type_compte_partener.objects.create(name='livreur')
        self.partner = Partenneur.objects.create(
            user=self.partner_user,
            type_compte=self.type_compte
        )
        self.remise = Remise.objects.get (
        partenneur=self.partner
        
        )
        
        
        # Create a user without any Remise
        self.non_partner_user = CustomUser.objects.create_user(username='normal', password='pass123')

    def test_unauthenticated_get(self):
        """GET without credentials should be 401."""
        resp = self.client.get(self.url)
        self.assertEqual(resp.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_successful_get_returns_code(self):
        """Authenticated partner with a Remise gets 200 + code."""
        self.client=APIClient()
        self.client.force_authenticate(user=self.partner_user)
        resp = self.client.get(self.url)
        print(f"reposneee of remise is {resp.json()}")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        data = resp.json()
        self.assertIn(resp.json()["data"]["code_invitation"], self.remise.code_invitation)

    def test_authenticated_no_remise_gets_400(self):
        """Authenticated user without a Remise gets 400."""
        self.client=APIClient()
        self.client.force_authenticate(user=self.non_partner_user)
        resp = self.client.get(self.url)
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)
        

    def test_wrong_method_returns_405(self):
        """POST (or any non-GET) returns 405."""
        self.client=APIClient()
        self.client.force_authenticate(user=self.partner_user)
        resp = self.client.post(self.url, {})
        self.assertEqual(resp.status_code, status.HTTP_405_METHOD_NOT_ALLOWED)
        


class RegisterLivreurTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        # assumes you have in urls.py:
        # path('api/register-livreur/', register_livreur, name='register_livreur')
        self.url = reverse('register_livreur')
        # create the “livreur” account type so .get(name__icontains="livreur") succeeds
        self.type_livreur = Type_compte_partener.objects.create(name='livreur')
    
    #________probleme de migrations ___________ a regler plus tard 
    # def test_successful_registration(self):
    #     """POST with valid data should create User, Partenneur, Vihucule, Livreur."""
    #     payload = {
    #         "username": "testlivreur",
    #         "password": "testpass123",
    #         "phone_number_1": "+213672463680",
            
    #         "email": "foo@example.com",
    #         "role":"partener"
    #         # include any other required fields for your CustomUserSerializer,
    #         # e.g. "email": "a@b.com", "first_name": "Foo", etc.
    #     }
    #     resp = self.client.post(
    #         self.url,
    #         data=json.dumps(payload),
    #         content_type='application/json'
    #     )
    #     print (f"responseeeeeeeeeee issssssssssss {resp.json()}")
    #     self.assertEqual(resp.status_code, 200)
        
    #     self.assertEqual(resp.json(), {"message": "livreur enregistré avec succès"})

    #     # verify user was created
        
    #     user = CustomUser.objects.get(username='testlivreur')
    #     # verify Partenneur
    #     part = Partenneur.objects.get(user=user)
    #     self.assertEqual(part.type_compte, self.type_livreur)
    #     # verify Vihucule
    #     veh = Vihucule.objects.get(pk=part.vihucule.pk)
    #     self.assertEqual(veh.type_vehicule, "Moto")
    #     # verify Livreur
    #     Livreur.objects.get(partenneur=part)

    def test_invalid_payload_returns_400(self):
        """POST with missing/invalid fields should return first serializer error."""

        resp = self.client.post(
            self.url,
            data=json.dumps({}),  # empty payload → serializer.is_valid() False
            content_type='application/json'
        )
        self.assertEqual(resp.status_code, 400)
        # error message comes from first field error, e.g. "This field is required."
        self.assertIn('message', resp.json())
        self.assertTrue(isinstance(resp.json()['message'], str))
        self.assertTrue(len(resp.json()['message']) > 0)

    # def test_missing_type_compte_raises_500(self):
    #     Type_compte_partener.objects.all().delete()
    #     payload = {"username": "testlivreur2", "password": "testpass123", "phone_number_1": "+213672463631"}
    #     resp = self.client.post(self.url, data=json.dumps(payload), content_type='application/json')
    #     self.assertEqual(resp.status_code, 500)
    #     self.assertEqual(resp.json().get("message"), "vous avez un problème de connexion, essayez plus tard")

    def test_get_method_not_allowed(self):
            """Any non-POST (e.g. GET) should return 405."""
            resp = self.client.get(self.url)
            self.assertEqual(resp.status_code, 405)




class RegisterChoffeurTests(TestCase):

    def setUp(self):
        # Create a user who meets the Isvtc permission requirements.
        # Adjust attributes as required by your Isvtc permission.
        self.vtc_user = CustomUser.objects.create_user(
            username="vtcuser",
            password="testpass",
            role="validation_vtc",  # or any role that passes Isvtc
            phone_number_1="1234567890"
        )
        
        # Create a Partenneur instance linked to a user.
        # In this example, we re-use the same user for simplicity.
        self.partenaire = Partenneur.objects.create(user=self.vtc_user)
        
        # Create a couple of Coursa instances for the Partenneur.
        self.cours1 = Coursa.objects.create(
            client=self.vtc_user, 
            partener=self.partenaire,
            km=10,
            prix=100,
            wilaya="Alger"
        )
        self.cours2 = Coursa.objects.create(
            client=self.vtc_user, 
            partener=self.partenaire,
            km=15,
            prix=150,
            wilaya="Alger"
        )
        
        self.url = reverse("validate_coursa_par_user_groupe")
        self.client = APIClient()

        self.client.force_authenticate(user=self.vtc_user)

    def test_validate_coursa_success(self):
        """
        Test that a valid POST request updates courses and returns a success message.
        """
        payload = {"id": self.partenaire.pk}
        response = self.client.post(self.url, data=json.dumps(payload), content_type="application/json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        response_data = response.json()
        self.assertEqual(response_data.get("message"), "Validation réussie")
        # The count should equal the number of Coursa instances created (2 in this test)
        self.assertEqual(response_data.get("count"), 2)
        self.assertTrue(response_data.get("success"))
        
        # Verify that the courses are updated (paye=True)
        self.cours1.refresh_from_db()
        self.cours2.refresh_from_db()
        self.assertTrue(self.cours1.paye)
        self.assertTrue(self.cours2.paye)
    
    def test_validate_coursa_no_courses_found(self):
        """
        Test that when no courses are found for the given partenaire,
        the view returns the appropriate message.
        """
        # Remove all courses related to the partenaire
        Coursa.objects.filter(partener=self.partenaire).delete()
        payload = {"id": self.partenaire.pk}
        response = self.client.post(self.url, data=json.dumps(payload), content_type="application/json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        response_data = response.json()
        self.assertEqual(response_data.get("message"), "Aucune course trouvée")
        self.assertFalse(response_data.get("success"))
    
    def test_validate_coursa_missing_chauffeur_id(self):
        """
        Test that if the JSON does not include an 'id', the view returns a 400 error.
        """
        payload = {}  # No "id" provided
        response = self.client.post(self.url, data=json.dumps(payload), content_type="application/json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        response_data = response.json()
        self.assertEqual(response_data.get("message"), "Missing chauffeur_id")
    
    def test_validate_coursa_invalid_json(self):
        """
        Test that invalid JSON in the request body returns a 400 error.
        """
        invalid_json = "this is not json"
        response = self.client.post(self.url, data=invalid_json, content_type="application/json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        response_data = response.json()
        self.assertEqual(response_data.get("message"), "Invalid JSON")
    
    def test_method_not_allowed(self):
        """
        Test that non-POST methods return a 405 error.
        """
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_405_METHOD_NOT_ALLOWED)






class GetAllPertenneurNoGroupeTests(APITestCase):
    def setUp(self):
        # Create a test centre appel user with the proper permissions.
        # Adjust user creation based on how your IsCentreappel permission is implemented.
        self.centreappel_user = CustomUser.objects.create_user(
            username='centreappel',
            password='testpass',
            is_active=True,
            role='centre_appel'  
        )
        self.client = APIClient()
        self.client.force_authenticate(user=self.centreappel_user)
        
        # Create Partenneur objects that meet the conditions:
        # user__groupe is None, user is inactive, and role is "partener".
        partner_user1 = CustomUser.objects.create_user(
            username='partner1',
            password='testpass',
            is_active=False,
            role='partener'
        )
        self.partenaire1 = Partenneur.objects.create(user=partner_user1)
        
        partner_user2 = CustomUser.objects.create_user(
            username='partner2',
            password='testpass',
            is_active=False,
            role='partener'
        )
        self.partenaire2 = Partenneur.objects.create(user=partner_user2)
        
        # Create some Partenneur objects that should not be counted.
        # Example 1: active user
        partner_user3 = CustomUser.objects.create_user(
            username='partner3',
            password='testpass',
            is_active=True,
            role='partener'
        )
        self.partenaire3 = Partenneur.objects.create(user=partner_user3)
        
        # Example 2: incorrect role
        partner_user4 = CustomUser.objects.create_user(
            username='partner4',
            password='testpass',
            is_active=False,
            role='other'
        )
        self.partenaire4 = Partenneur.objects.create(user=partner_user4)
        
        # Example 3: user with groupe not None.
        partner_user5 = CustomUser.objects.create_user(
            username='partner5',
            password='testpass',
            is_active=False,
            role='partener'
        )
        # Simulate having a groupe by setting the attribute; adjust based on your model.
        partner_user5.groupe = "some_group"
        partner_user5.save()
        self.partenaire5 = Partenneur.objects.create(user=partner_user5)
    
    def test_get_all_pertenneur_no_groupe_get_method(self):
        """
        Test that GET request returns the count of Partenneur objects 
        where the associated user has no groupe, is inactive, and has role 'partener'.
        """
        url = reverse('get_all_pertenneur_no_groupe') 
        self.client=APIClient()
        self.client.force_authenticate(user=self.centreappel_user) # Ensure the URL name matches your configuration.
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        # Only partner1 and partner2 should meet the criteria.
        self.assertEqual(data.get("count"), 2)
    
    def test_invalid_method(self):
        """
        Test that a POST request (or any non-GET method) returns a 405 Method Not Allowed.

        """
        self.client.force_authenticate(user=self.centreappel_user)
        url = reverse('get_all_pertenneur_no_groupe')
        response = self.client.post(url)
        self.assertEqual(response.status_code, 405)
# class GetVersionLastTests(APITestCase):
#     def setUp(self):
#         self.client = APIClient()
#         self.url = reverse('get_version_last')
        
#         # Create two DeviceApp instances with different create_at timestamps
#         self.device1 = DeviceApp.objects.create(
#             # Add other required fields here, e.g., version="1.0.0"
#             create_at=timezone.now()
#         )
#         # Ensure the second instance is created later than the first
#         self.device2 = DeviceApp.objects.create(
#             # Add other required fields here, e.g., version="1.0.1"
#             create_at=timezone.now() + timezone.timedelta(seconds=10)
#         )

#     def test_get_version_last_success(self):
#         """
#         Test that a GET request returns the latest DeviceApp instance.
#         """
#         response = self.client.get(self.url)
#         self.assertEqual(response.status_code, status.HTTP_200_OK)
#         data = response.json()
#         # The view returns a key "data" with serialized device information.
#         self.assertIn("data", data)
        
#         # Verify that the returned device is the latest one (device2).
#         # Adjust the key (e.g., 'version') based on your DeviceAppSerializer output.
#         # For instance, if your serializer includes a "version" field, you might do:
#         # self.assertEqual(data["data"]["version"], "1.0.1")
#         # Here we simply compare the id or create_at if available.
#         self.assertEqual(data["data"].get("id"), self.device2.id)

#     def test_get_version_last_not_found(self):
#         """
#         Test that a GET request returns a 404 status when no DeviceApp exists.
#         """
#         # Remove all DeviceApp objects.
#         DeviceApp.objects.all().delete()
#         response = self.client.get(self.url)
#         self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
#         data = response.json()
#         self.assertIn("message", data)
#         # You might check the exact message if needed:
#         # self.assertEqual(data["message"], "Probleme de connexion")

#     def test_non_get_method(self):
#         """
#         Test that a non-GET request returns a 405 Method Not Allowed.
#         """
#         response = self.client.post(self.url)
#         self.assertEqual(response.status_code, status.HTTP_405_METHOD_NOT_ALLOWED)
#         data = response.json()
#         self.assertIn("message", data)
#         # Optionally, check that the message matches the view's response.
#         # self.assertEqual(data["message"], "Probleme de connexion")
class GetTypePartenerTests(APITestCase):
    def setUp(self):
        # make sure you have a URL pattern named "get_type_partener" in your urls.py
        self.url = reverse('get_type_partener')
        self.client = APIClient()

        # create a user who *is* a partner
        self.partner_user = CustomUser.objects.create_user(username='partner', password='pass123')
        self.type_compte = Type_compte_partener.objects.create(name='gold')
        self.partner = Partenneur.objects.create(
            user=self.partner_user,
            type_compte=self.type_compte
        )

        # create a user who is NOT a partner
        self.non_partner_user = CustomUser.objects.create_user(username='normal', password='pass123')

    def test_unauthenticated_get(self):
        """Should require authentication."""
        resp = self.client.get(self.url)
        self.assertEqual(resp.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_successful_get_returns_type(self):
        """Authenticated partner should get 200 + correct type."""
        self.client=APIClient()
        self.client.force_authenticate(user=self.partner_user)
        resp = self.client.get(self.url)
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(resp.json(), {"type": "gold"})

    def test_authenticated_non_partner_gets_400(self):
        """Authenticated user without Partenneur should get 400."""
        self.client=APIClient()
        self.client.force_authenticate(user=self.non_partner_user)
        resp = self.client.get(self.url)
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(resp.json(), {"message": "Probleme de connexion"})

    def test_wrong_method_returns_405(self):
        """Any non-GET method should return 405."""
        self.client=APIClient()
        self.client.force_authenticate(user=self.partner_user)
        resp = self.client.post(self.url, {})
        self.assertEqual(resp.status_code, status.HTTP_405_METHOD_NOT_ALLOWED)
        # note: your view returns lowercase 'probleme' here
class GetCodeRemiseTests(APITestCase):
    def setUp(self):
        # URL must match the name you give in urls.py
        self.url = reverse('get_code_remise')
        self.client = APIClient()
        
        # Create a “partner” user and attach a Partenneur + Remise
        self.partner_user = CustomUser.objects.create_user(username='partner', password='pass123')
        self.type_compte = Type_compte_partener.objects.create(name='livreur')
        self.partner = Partenneur.objects.create(
            user=self.partner_user,
            type_compte=self.type_compte
        )
        self.remise = Remise.objects.get (
        partenneur=self.partner
        
        )
        
        
        # Create a user without any Remise
        self.non_partner_user = CustomUser.objects.create_user(username='normal', password='pass123')

    def test_unauthenticated_get(self):
        """GET without credentials should be 401."""
        resp = self.client.get(self.url)
        self.assertEqual(resp.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_successful_get_returns_code(self):
        """Authenticated partner with a Remise gets 200 + code."""
        self.client=APIClient()
        self.client.force_authenticate(user=self.partner_user)
        resp = self.client.get(self.url)
        print(f"reposneee of remise is {resp.json()}")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        data = resp.json()
        self.assertIn(resp.json()["data"]["code_invitation"], self.remise.code_invitation)

    def test_authenticated_no_remise_gets_400(self):
        """Authenticated user without a Remise gets 400."""
        self.client=APIClient()
        self.client.force_authenticate(user=self.non_partner_user)
        resp = self.client.get(self.url)
        self.assertEqual(resp.status_code, 200)
        

    def test_wrong_method_returns_405(self):
        """POST (or any non-GET) returns 405."""
        self.client=APIClient()
        self.client.force_authenticate(user=self.partner_user)
        resp = self.client.post(self.url, {})
        self.assertEqual(resp.status_code, status.HTTP_405_METHOD_NOT_ALLOWED)
        


class RegisterLivreurTests(TestCase):
    def setUp(self):
        self.client = APIClient()

        # assumes you have in urls.py:
        # path('api/register-livreur/', register_livreur, name='register_livreur')
        self.url = reverse('register_livreur')
        # create the “livreur” account type so .get(name__icontains="livreur") succeeds
        self.type_livreur = Type_compte_partener.objects.create(name='livreur')
    
    #________probleme de migrations ___________ a regler plus tard 
    # def test_successful_registration(self):
    #     """POST with valid data should create User, Partenneur, Vihucule, Livreur."""
    #     payload = {
    #         "username": "testlivreur",
    #         "password": "testpass123",
    #         "phone_number_1": "+213672463680",
            
    #         "email": "foo@example.com",
    #         "role":"partener"
    #         # include any other required fields for your CustomUserSerializer,
    #         # e.g. "email": "a@b.com", "first_name": "Foo", etc.
    #     }
    #     resp = self.client.post(
    #         self.url,
    #         data=json.dumps(payload),
    #         content_type='application/json'
    #     )
    #     print (f"responseeeeeeeeeee issssssssssss {resp.json()}")
    #     self.assertEqual(resp.status_code, 200)
        
    #     self.assertEqual(resp.json(), {"message": "livreur enregistré avec succès"})

    #     # verify user was created
        
    #     user = CustomUser.objects.get(username='testlivreur')
    #     # verify Partenneur
    #     part = Partenneur.objects.get(user=user)
    #     self.assertEqual(part.type_compte, self.type_livreur)
    #     # verify Vihucule
    #     veh = Vihucule.objects.get(pk=part.vihucule.pk)
    #     self.assertEqual(veh.type_vehicule, "Moto")
    #     # verify Livreur
    #     Livreur.objects.get(partenneur=part)

    def test_invalid_payload_returns_400(self):
        """POST with missing/invalid fields should return first serializer error."""

        resp = self.client.post(
            self.url,
            data=json.dumps({}),  # empty payload → serializer.is_valid() False
            content_type='application/json'
        )
        self.assertEqual(resp.status_code, 400)
        # error message comes from first field error, e.g. "This field is required."
        self.assertIn('message', resp.json())
        self.assertTrue(isinstance(resp.json()['message'], str))
        self.assertTrue(len(resp.json()['message']) > 0)



    # def test_missing_type_compte_raises_500(self):
    #     Type_compte_partener.objects.all().delete()
    #     payload = {"username": "testlivreur2", "password": "testpass123", "phone_number_1": "+213672463631"}
    #     resp = self.client.post(self.url, data=json.dumps(payload), content_type='application/json')
    #     self.assertEqual(resp.status_code, 500)
    #     self.assertEqual(resp.json().get("message"), "vous avez un problème de connexion, essayez plus tard")


    def test_get_method_not_allowed(self):
            """Any non-POST (e.g. GET) should return 405."""
            resp = self.client.get(self.url)
            self.assertEqual(resp.status_code, 405)




class RegisterChoffeurTests(TestCase):
    def setUp(self):
        self.client = APIClient()

        # assumes you have in urls.py:
        # path('api/register-livreur/', register_livreur, name='register_livreur')
        self.url = reverse('register_choffeur')
        # create the “livreur” account type so .get(name__icontains="livreur") succeeds
        self.type_livreur = Type_compte_partener.objects.create(name='choffeur')

    def test_successful_registration(self):
        """POST with valid data should create User, Partenneur, Vihucule, Livreur."""
        payload = {
    "username": "driveerrrrrrrrrrrr",
    "password": "SecurePassword123!",
    "email": "driver.ahmed@exaampsle.com",
    "phone_number_1": "+213612345660",
    
    "card_number": "123456789123456789",
    "RC": "RC789456",
    "Nif": "NIF123456789",
    "numero_act": "ACT987654",
    
     "modele": "Clio",
     "marque": "Renault",
     "matricule": "12345A12",
     "num_assurance": "ASUR12345678",
     "num_scanner": "SCAN87654321",
     "date_expiration_assurance": "2025-12-31",
     "date_expiration_scanner": "2025-06-30",
     "type_vehicule": "Classique"
           
        }
        resp = self.client.post(
            self.url,
            data=json.dumps(payload),
            content_type='application/json'
        )
        
        self.assertEqual(resp.status_code, 201)
        
        self.assertEqual(resp.json(), {"message": "choffeur enregistré avec succès"})

        # verify user was created
        
        user = CustomUser.objects.get(username='driveerrrrrrrrrrrr')
        # verify Partenneur
        part = Partenneur.objects.get(user=user)
        self.assertEqual(part.type_compte, self.type_livreur)
        # verify Vihucule
        veh = Vihucule.objects.get(pk=part.vihucule.pk)
        self.assertIsNotNone(veh)  # Ensure the vehicle exists
        
        # verify Livreur
        

    def test_invalid_payload_returns_400(self):
        """POST with missing/invalid fields should return first serializer error."""

        resp = self.client.post(
            self.url,
            data=json.dumps({}),  # empty payload → serializer.is_valid() False
            content_type='application/json'
        )
        self.assertEqual(resp.status_code, 400)
        # error message comes from first field error, e.g. "This field is required."
        self.assertIn('message', resp.json())
        self.assertTrue(isinstance(resp.json()['message'], str))
        self.assertTrue(len(resp.json()['message']) > 0)

    # def test_missing_type_compte_raises_500(self):
    #     Type_compte_partener.objects.all().delete()
    #     payload = {"username": "testlivreur2", "password": "testpass123", "phone_number_1": "+213672463631"}
    #     resp = self.client.post(self.url, data=json.dumps(payload), content_type='application/json')
    #     self.assertEqual(resp.status_code, 500)
    #     self.assertEqual(resp.json().get("message"), "vous avez un problème de connexion, essayez plus tard")

    def test_get_method_not_allowed(self):
            """Any non-POST (e.g. GET) should return 405."""
            resp = self.client.get(self.url)
            self.assertEqual(resp.status_code, 405)


#____probleme de migrations magasin problemùe migrations _______________________
# class RegisterMgasinTestCase(TestCase):
#     def setUp(self):
#         self.url=reverse("register_magasin")
#         self.type_partenneur =Type_compte_partener.objects.create(
#             name="magasin"
#         )
#         self.client=APIClient()
#     def test_create_succes_magasin (self):

#         payload = {
#             "username": "testmagasin",
#             "password": "testmagasin",
#             "phone_number_1": "+213672463680",
#             "email": "foo@example.com"
#             # include any other required fields for your CustomUserSerializer,
#             # e.g. "email": "a@b.com", "first_name": "Foo", etc.
#         }
#         response = self.client.post(self.url, data=json.dumps(payload), content_type='application/json')
        
#         print (f"responseeee de creation magasin :{response.json()}")
#         self.partenneur=Partenneur.objects.get(user__username="testmagasin")

#         self.magasin=Magasin.objects.get(owner=self.partenneur)
#         self.assertTrue(self.partenneur)
#         self.assertTrue(self.magasin)
#         self.assertEqual(response.status_code,200)
#         self.assertEqual(response.json()["message"],"magasin enregistré avec succès")
        
        

class ApprovieFlexiseTestCase (TestCase):
    def setUp(self):
        self.url=reverse("approvie_flixy")
        self.client=APIClient()
        self.superviseur=CustomUser.objects.create(
            username="super",
            email="super@gmail.com",
            phone_number_1="+21367243631",
            role="superviseur"

        )
        self.client1=CustomUser.objects.create(
            username="client",
            email="client@gmail.com",
            phone_number_1="+21367243630",
            role="client"

        )
        self.centreappel=CustomUser.objects.create(
             username="centre_appel",
            email="centre_appel@gmail.com",
            phone_number_1="+21367243639",
            role="centre_appel"
        )
        self.flyxie= Flixy.objects.create(
            superviseur=self.superviseur,
            centre_appel=self.centreappel,
            somme=10000,
            wilaya="tlemcen",
            somme_a_envoye=12000,
            etat="en_attente",
            appouvie_par_super_v=False


        )
    def test_noauthetfie(self):
        self.url=reverse("approvie_flixy")
        respose=self.client.post(self.url)
        self.assertEqual(respose.status_code,401)
    def test_nopermission (self):
        self.client=APIClient()
        self.client.force_authenticate(user=self.client)
    def test_appovie_succes (self):
        self.client=APIClient()
        self.client.force_authenticate(user=self.superviseur)
        response = self.client.patch(self.url, data={"flixy_id": self.flyxie.pk}, format="json")
        self.flyxie.refresh_from_db()  # Refresh the object to get updated values
        self.assertEqual(response.status_code, 200)
        self.assertTrue(self.flyxie.appouvie_par_super_v)
        self.assertEqual(response.json()["message"], "le demande est approvie")
    def test_invalide_id(self):
        self.client=APIClient()
        self.client.force_authenticate(user=self.superviseur)
        response = self.client.patch(self.url, data={"flixy_id": 99}, format="json")
          # Refresh the object to get updated values
        self.assertEqual(response.status_code, 404)
        self.assertEqual(response.json()["message"],"la demmande  id pas valide")
    
          
        self.assertEqual(response.status_code, 404)
    
    # def test_invalid_methods_return_405(self):
    #     """All non-PATCH methods (GET, POST, PUT, DELETE) should return 405."""
    #     invalid_methods = ['GET', 'POST', 'PUT', 'DELETE']
    #     self.client=APIClient()
    #     self.client.force_authenticate(user=self.superviseur)
    #     data = json.dumps({'flixy_id': self.flyxie.id})

    #     for method in invalid_methods:
    #         # Use client.generic to send any method with a JSON body
    #         response = self.client.generic(
    #             method,
    #             self.url,
    #             data=data,
    #             content_type='application/json'
    #         )
    #         self.assertEqual(
    #             response.status_code,
    #             status.HTTP_405_METHOD_NOT_ALLOWED,
               
    #         )
    #         self.assertEqual(
    #             response.json(),
    #             {"message": f'Method "method pas valide'},
                
    #         )
class GetAllPartnerSuperviseurTests(APITestCase):
    def setUp(self):
        self.client = APIClient()
        # Make sure this name matches your URLconf
        self.url = reverse('get_all_partner_superviseur')

        # Create two users with different attributes
        self.user1 = CustomUser.objects.create_user(
            username='user1',
            password='pass',
            phone_number_1='+213672463136',
            wilaya_code='1',
            is_active=True,
            role="superviseur",
            groupe='G1'
        )
        self.user2 = CustomUser.objects.create_user(
            username='user2',
            password='pass',
            phone_number_1='+213672463630',
            wilaya_code='2',
            is_active=False,
            role="superviseur",
            groupe='G2'
        )
        self.user3 = CustomUser.objects.create_user(
            username='user3',
            password='pass',
            phone_number_1='+213672463639',
            wilaya_code='2',
            is_active=False,
            role="client",
            groupe='G2'
        )
        self.partner_type=Type_compte_partener.objects.create(
            name="choffeur"
        )

        # Create corresponding Partenneur records
        self.partner1 = Partenneur.objects.create(
            user=self.user1,
            type_compte=self.partner_type
        )
        self.partner2 = Partenneur.objects.create(
            user=self.user2,
            type_compte=self.partner_type
        )
    def test_with_no_permission(self):
        self.client=APIClient()
        self.client.force_authenticate(user=self.user3)
        response=self.client.get(self.url)
        self.assertEqual(response.status_code,403)
    def test_no_authenfie(self):
        response=self.client.get(self.url)
        self.assertEqual(response.status_code,401)
    def test_get_all_returns_all(self):
        """GET without filters should return both partners"""
        self.client=APIClient()
        self.client.force_authenticate(user=self.user1)
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # pagination: results under 'results'
        self.assertEqual(len(response.data['results']), 2)

    def test_search_query_filters_by_phone(self):
        self.client=APIClient()
        self.client.force_authenticate(user=self.user1)
        """Filtering by `search` should match phone_number_1"""
        response = self.client.get(self.url, {'search': '+213'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 2)
        self.assertEqual(response.data['results'][0]['user']['phone_number_1'], '+213672463630')

    def test_wilaya_filter(self):

        """Filtering by `wilaya` should match wilaya_code (case‐insensitive)"""
        self.client=APIClient()
        self.client.force_authenticate(user=self.user1)
        response = self.client.get(self.url, {'wilaya': '1'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)
        self.assertEqual(response.data['results'][0]['user']['wilaya_code'], 1)

    def test_is_active_true_filter(self):
        """Filtering by `is_active=true` should return only active users"""
        self.client=APIClient()
        self.client.force_authenticate(user=self.user1)
        response = self.client.get(self.url, {'is_active': 'true'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)
        self.assertTrue(response.data['results'][0]['user']['is_active'])

    def test_is_active_false_filter(self):
        """Filtering by `is_active=false` should return only inactive users"""
        self.client=APIClient()
        self.client.force_authenticate(user=self.user1)
        response = self.client.get(self.url, {'is_active': 'false'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)
        self.assertFalse(response.data['results'][0]['user']['is_active'])

    def test_type_compte_filter(self):
        """Filtering by `type_compte` should match exactly"""
        self.client=APIClient()
        self.client.force_authenticate(user=self.user1)
        response = self.client.get(self.url, {'type_compte': self.partner_type.pk})
        
        self.client.force_authenticate(user=self.user1)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 2)
        self.assertEqual(response.data['results'][0]['type_compte']["name"], 'choffeur')

    def test_groupe_filter(self):
        """Filtering by `groupe` should match user.groupe"""
        self.client=APIClient()
        self.client.force_authenticate(user=self.user1)
        response = self.client.get(self.url, {'groupe': 'G1'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)
        self.assertEqual(response.data['results'][0]['user']['groupe'], 'G1')

    def test_pagination_default_page_size(self):
        """Ensure pagination limits results to 20 per page"""
        self.client=APIClient()
        self.client.force_authenticate(user=self.user1)
        # create 19 more partners for user1
        for i in range(19):
            u = CustomUser.objects.create_user(
                username=f'extra{i}',
                password='pass',
                phone_number_1=f'555{i}',
                wilaya_code='01',
                is_active=True,
                groupe='G1'
            )
            Partenneur.objects.create(user=u, type_compte=self.partner_type)
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # total created: 1 original partner1 + 19 extras + partner2 = 21
        # page_size is 20, so results length should be 20
        self.assertEqual(len(response.data['results']), 20)
        self.assertIsNotNone(response.data.get('next'))

    def test_method_not_allowed(self):
        self.client=APIClient()
        self.client.force_authenticate(user=self.user1)
        """POST should return 405"""
        response = self.client.post(self.url, {})
        self.assertEqual(response.status_code, status.HTTP_405_METHOD_NOT_ALLOWED)




class VerifieTokenTests(TestCase):
    def setUp(self):
        self.factory = RequestFactory()
        self.user = CustomUser.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123',
            role="client"
        )
        self.token_generator = PasswordResetTokenGenerator()
        self.valid_token = self.token_generator.make_token(self.user)
    
    def test_valid_token(self):
        """Test with valid token and user ID"""
        data = {
            "token": self.valid_token,
            "uid": self.user.id
        }
        request = self.factory.post(
            '/verifie_token/',
            data=json.dumps(data),
            content_type='application/json'
        )
        
        response = verifie_token(request)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(json.loads(response.content), {"message": "token is valide "})
    
    def test_invalid_token(self):
        """Test with invalid token"""
        data = {
            "token": "invalidtoken",
            "uid": self.user.id
        }
        request = self.factory.post(
            '/verifie_token/',
            data=json.dumps(data),
            content_type='application/json'
        )
        
        response = verifie_token(request)
        self.assertEqual(response.status_code, 404)
        self.assertEqual(json.loads(response.content), {"message": "token invalide or expried"})
    
    def test_invalid_user_id(self):
        """Test with non-existent user ID"""
        data = {
            "token": self.valid_token,
            "uid": 9999  # Non-existent ID
        }
        request = self.factory.post(
            '/verifie_token/',
            data=json.dumps(data),
            content_type='application/json'
        )
        
        response = verifie_token(request)
        # Note: Your view currently returns 200 status for this case, which might not be correct
        # You might want to return 404 in this case
        self.assertEqual(json.loads(response.content), {"message": "user id not found or invalide"})
    
    def test_missing_token(self):
        """Test with missing token in request"""
        data = {
            "uid": self.user.id
        }
        request = self.factory.post(
            '/verifie_token/',
            data=json.dumps(data),
            content_type='application/json'
        )
        
        response = verifie_token(request)
        self.assertEqual(response.status_code, 404)
        self.assertEqual(json.loads(response.content), {"message": "lien incorrect"})
    
    def test_missing_uid(self):
        """Test with missing user ID in request"""
        data = {
            "token": self.valid_token
        }
        request = self.factory.post(
            '/verifie_token/',
            data=json.dumps(data),
            content_type='application/json'
        )
        
        response = verifie_token(request)
        self.assertEqual(response.status_code, 404)
        self.assertEqual(json.loads(response.content), {"message": "lien incorrect"})
    
    def test_non_post_request(self):
        """Test with GET request instead of POST"""
        request = self.factory.get('/verifie_token/')
        
        response = verifie_token(request)
        self.assertEqual(response.status_code, 405)
        self.assertEqual(json.loads(response.content), {"message": "method not allow "})
    
    def test_expired_token(self):
        """Test with expired token (simulated by changing user password)"""
        # Generate a valid token
        token = self.token_generator.make_token(self.user)
        
        # Change the user's password to invalidate all tokens
        self.user.set_password('newpassword')
        self.user.save()
        
        data = {
            "token": token,
            "uid": self.user.id
        }
        request = self.factory.post(
            '/verifie_token/',
            data=json.dumps(data),
            content_type='application/json'
        )
        
        response = verifie_token(request)
        self.assertEqual(response.status_code, 404)
        self.assertEqual(json.loads(response.content), {"message": "token invalide or expried"})
class DesactiveAccountTestCase (TestCase):
    def setUp(self):
        self.url=reverse("desactiver_account")
        self.superviseur =CustomUser.objects.create_user(
            username="customer",
            email="customeruser@gmail.com",
            password="Testwailammar2000",
            phone_number_1="+213672463680",
            role="superviseur"
        )
        self.nopermission =CustomUser.objects.create (
            username="nopermision",
            password="Testwailammar2000",
            email="nopermission@gmail.com",
            phone_number_1="+213672463631",
            role="client"
        )
        self.testcustomer =CustomUser.objects.create(
            username="testcustomer5",
            password="Testwailammar2000",
            email="wailammadd@gmail.com",
            role="superviseur"
        )
        self.testcustomer2 =CustomUser.objects.create(
            username="testcustomer",
            password="Testwailammar2000",
            email="wailammadd@gmail.com",
            role="superviseur",
            is_active=True
        )
        self.chefbureux =CustomUser.objects.create(
            username="Testwailammar2000",
            password="testetst",
            email="wailammadd@gmail.com",
            role="chef_bureau"
        )
    def test_401 (self):
        resposne =self.client.patch(self.url)
        self.assertEqual(resposne.status_code,401)



    def test_no_permission(self):
        self.client=APIClient()
        self.client.force_authenticate(user=self.nopermission)
        response =self.client.patch (self.url)
        self.assertEqual(response.status_code,403)

    def test_succes_operation(self):
        self.client=APIClient()
        self.client.force_authenticate(user=self.superviseur)
        response=self.client.patch(self.url, data={"id": self.testcustomer2.pk}, format='json')
        self.assertEqual(response.json()["message"],"Le compte est desactivé")
        self.testcustomer2.refresh_from_db()
        self.assertFalse(self.testcustomer2.is_active)
    def test_404_id_valide(self):
        self.client=APIClient()
        self.client.force_authenticate(user=self.chefbureux)
        response =self.client.patch(self.url,data={"id":"99999"},format="json")
        self.assertEqual(response.json()["message"], "L'ID de l'utilisateur n'est pas valide")
        self.assertEqual(response.status_code ,404)
    
class GetAllLivreurTestCase (TestCase):
    def setUp(self):
        self.url=reverse("get_all_livreures")
        self.commercial =CustomUser.objects.create (
            username="comm",
            password='Commmmmmmm1234567',
            phone_number_1="+2136724631",
            role="gestion_commercial",
            email="comm@live.fr"
        )
        self.nopermissss=CustomUser.objects.create(
            username="test",
            password='Commmmmmmm1234567',
            phone_number_1="+2136724632",
            role="client",
            email="test@live.fr"
            
        )
        self.customer_livreur=CustomUser.objects.create(
          username="livreur1",
          email="livreur@gmail.com",
          password="TestCustomer2000",
          phone_number_1="+213673463632"

        )
        self.partennneur =Partenneur.objects.create(
            user=self.customer_livreur
        )
        self.livreur=Livreur.objects.create(
            partenneur=self.partennneur
        )
        self.client
    def test_noauth (self):
        self.client=APIClient()
        response =self.client.get(self.url)
        self.assertEqual(response.status_code,401)
    def test_no_permisssion (self):
        self.client=APIClient()
        self.client.force_authenticate(user=self.nopermissss)
        response =self.client.get(self.url)
        self.assertEqual(response.status_code,403)
    def test_get_all_livreur_succes (self):
        self.client=APIClient()
        self.client.force_authenticate(user=self.commercial)
        response=self.client.get(self.url)
        print (f'')
        self.assertEqual(response.status_code,200)


class GetAllGroupeParTlemcenTests(APITestCase):
    def setUp(self):
        # URL for the view; ensure your urls.py names this view accordingly
        self.url = reverse('get_all_groupe_par_tlemcen')

        # Create active chef_bureau users in wilaya 'tlemcen' with different groupes
        CustomUser.objects.create(
            username='user1', wilaya_code=13, role='chef_bureau', is_active=True,
            groupe='G1', groupe_name='Group One', wilaya='Tlemcen'
        )
        CustomUser.objects.create(
            username='user2', wilaya_code=13, role='chef_bureau', is_active=True,
            groupe='G2', groupe_name='Group Two', wilaya='Tlemcen'
        )
        # Duplicate groupe to test distinct
        CustomUser.objects.create(
            username='user3', wilaya_code=13, role='chef_bureau', is_active=True,
            groupe='G1', groupe_name='Group One Duplicate', wilaya='Tlemcen'
        )
        # Inactive user should be excluded
        CustomUser.objects.create(
            username='user4', wilaya_code=13, role='chef_bureau', is_active=False,
            groupe='G3', groupe_name='Group Three', wilaya='Tlemcen'
        )
        # Different role should be excluded
        CustomUser.objects.create(
            username='user5', wilaya_code=13, role='other_role', is_active=True,
            groupe='G4', groupe_name='Group Four', wilaya='Tlemcen'
        )
        # Different wilaya should be excluded
        CustomUser.objects.create(
            username='user6', wilaya_code=31, role='chef_bureau', is_active=True,
            groupe='G5', groupe_name='Group Five', wilaya='Oran'
        )
        self.nopermission=CustomUser.objects.create (
            username='user66', wilaya_code=31, role='client', is_active=True,
            groupe='G5', groupe_name='Group Five', wilaya='Oran'
        )
        self.commercial =CustomUser.objects.create (
            username="commerciallll",
            email="commercial@gmail.com",
            password="testTestCommercial2000",
            phone_number_1="+2136724631",
            role="gestion_commercial"


        )
    def test_no_athentificat (self ):
        self.client=APIClient()
        response =self.client.get(self.url)
        self.assertEqual(response.status_code,401)
    def test_no_permisssion (self):
        self.client=APIClient()
        self.client.force_authenticate(user=self.nopermission)
        reposne=self.client.get(self.url)
        self.assertEqual(reposne.status_code,403)

    def test_get_all_groupes_success(self):
        """
        GET with valid wilaya should return distinct groupes for active chef_bureau users.
        """
        self.client=APIClient()
        self.client.force_authenticate(user=self.commercial)
        payload = {'wilaya': 13}
        response = self.client.generic(
            method='GET',
            path=self.url,
            data=json.dumps(payload),
            content_type='application/json'
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertEqual(data.get('message'), 'success')

        groupes = data.get('data', [])
        # Should include only G1 and G2
        codes = {g['groupe'] for g in groupes}
        self.assertSetEqual(codes, {'G1', 'G2'})
        # Check that each entry has required keys
        for entry in groupes:
            self.assertIn('groupe', entry)
            self.assertIn('groupe_name', entry)
            self.assertIn('wilaya', entry)

    def test_get_no_group_found(self):
        """
        GET with wilaya having no matching users returns success with empty list.
        """
        self.client=APIClient()
        self.client.force_authenticate(user=self.commercial)
        payload = {'wilaya': 19}  # no users created for setif
        response = self.client.generic(
            method='GET',
            path=self.url,
            data=json.dumps(payload),
            content_type='application/json'
        )
        # According to implementation, returns 200 with empty data
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertEqual(data.get('message'), 'success')
        self.assertEqual(data.get('data'), [])

    def test_invalid_json_body(self):
        """
        GET with invalid JSON in body should return 400 Bad Request.

        """
        self.client=APIClient()
        self.client.force_authenticate(user=self.commercial)
        response = self.client.generic(
            method='GET',
            path=self.url,
            data='not-a-json',
            content_type='application/json'
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.json().get('message'), 'Invalid JSON format in request body')


class GetAllPartnerForCommercialeTests(APITestCase):
    def setUp(self):
        # URL for the view; ensure your urls.py names this view accordingly
        self.url = reverse('get_all_partner_for_commerciale')

        # Create a commerciale user and authenticate
        self.commercial_user = CustomUser.objects.create_user(
            username='commercial1',
            password='pass123',
            role='gestion_commercial',
            email='commercial@gmail.com',
            phone_number_1='+2136724631'
        )
        self.client = APIClient()
        self.client.force_authenticate(user=self.commercial_user)

        # Create related lookup objects
        self.abonnement1 = Abonnment_compte.objects.create(name='Abonnement Gold')
        self.abonnement2 = Abonnment_compte.objects.create(name='Abonnement Silver')
        self.type_compte_magasin = Type_compte_partener.objects.create(name='magasin')
        self.type_compte_chauffeur = Type_compte_partener.objects.create(name='choffeur')

        # Create a vehicle for chauffeurs
        self.vihucule = Vihucule.objects.create(
            modele='Model X',
            marque='Marque Y',
            matricule='ABC123',
            num_assurance='INS123',
            num_scanner='SCN123'
        )

        # Create users with different phone numbers and groupes
        self.user1 = CustomUser.objects.create(
            username='u1',
            phone_number_1='123456',
            groupe='G1'
        )
        self.user2 = CustomUser.objects.create(
            username='u2',
            phone_number_1='654321',
            groupe='G2'
        )
        self.user3 = CustomUser.objects.create(
            username='u3',
            phone_number_1='000000',
            groupe='G3'
        )

        # Create Partenneur entries
        # 1) Magasin partner: should have no vehicle, create a Magasin
        self.partner_magasin = Partenneur.objects.create(
            user=self.user1,
            vihucule=None,
            type_partener=self.abonnement1,
            type_compte=self.type_compte_magasin
        )
        Magasin.objects.create(
            owner=self.partner_magasin,
            name='Magasin 1',
            address='Addr 1'
        )

        # 2) Chauffeur partner: must have vehicle and Livreur record
        self.partner_chauffeur = Partenneur.objects.create(
            user=self.user2,
            vihucule=self.vihucule,
            type_partener=self.abonnement1,
            type_compte=self.type_compte_chauffeur
        )
        Livreur.objects.create(
            partenneur=self.partner_chauffeur,
            magasin=None,
            is_available=True,
            wilaya='Tlemcen'
        )

        # 3) Another chauffeur with different abonnement
        self.partner_chauffeur2 = Partenneur.objects.create(
            user=self.user3,
            vihucule=self.vihucule,
            type_partener=self.abonnement2,
            type_compte=self.type_compte_chauffeur
        )
        Livreur.objects.create(
            partenneur=self.partner_chauffeur2,
            magasin=None,
            is_available=False,
            wilaya='Oran'
        )

    def test_magasin_partner_has_no_vehicle_and_has_magasin(self):
        """
        A partner with type_compte 'magasin' should not have a vehicle, but should have a Magasin entry.
        """
        partner = self.partner_magasin
        self.assertIsNone(partner.vihucule)
        # Should exist exactly one Magasin for this partner
        magasins = partner.partener_magsin.all()
        self.assertEqual(magasins.count(), 1)
        self.assertEqual(magasins.first().name, 'Magasin 1')

    def test_chauffeur_partner_has_vehicle_and_livreur(self):
        """
        A partner with type_compte 'choffeur' should have a vehicle and a Livreur record.
        """
        partner = self.partner_chauffeur
        self.assertIsNotNone(partner.vihucule)
        self.assertEqual(partner.vihucule.matricule, 'ABC123')
        # Should exist exactly one Livreur for this partner
        livreurs = partner.livreur_set.all() if hasattr(partner, 'livreur_set') else partner.livreur
        # Using related_name 'livreur'
        livreurs = partner.livreur
        self.assertTrue(livreurs.is_available)
        self.assertEqual(livreurs.wilaya, 'Tlemcen')

    def test_multiple_chauffeurs(self):
        """
        Ensure multiple chauffeur partners can be created with vehicles and Livreur.
        """
        partner2 = self.partner_chauffeur2
        self.assertIsNotNone(partner2.vihucule)
        livreur2 = partner2.livreur
        self.assertFalse(livreur2.is_available)
        self.assertEqual(livreur2.wilaya, 'Oran')

    def test_view_filters_include_all_partners(self):
        """
        GET without filters should list all partners (magasin + chauffeurs).
        """
        self.client=APIClient()
        self.client.force_authenticate(user=self.commercial_user)
        
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        # Should list 3 partners
        self.assertEqual(data['count'], 3)
        ids = {item['user']['username'] for item in data['results']}
        self.assertSetEqual(ids, {'u1', 'u2', 'u3'})



class UpdateTypePartenneurTestCase (APITestCase):
    def setUp(self):
        self.url=reverse("update_type_compte_partener")
        self.commercial =CustomUser.objects.create (
            username="commercial",
            email='commmercila@gmail.com',
            password="testtestT2000",
            phone_number_1="+213672463630",
            role="gestion_commercial"
        )
        self.nopermission=CustomUser.objects.create (
            username="client",
            email='client@gmail.com',
            password="testtestT2000",
            phone_number_1="+213672463631",
            role="client"
        )
        self.partenneur_user =CustomUser.objects.create(
            username="partenneur",
            email="partennneur@gmail.com",
           role="partener",
            password ="testtestT2000",
            phone_number_1='+213672463632',

        )
        self.type_partenneur_choffeur =Type_compte_partener.objects.create (
            name="choffeur"
        )
        self.type_partnnneur_livreur =Type_compte_partener.objects.create(
            name="livreur"
        )
        self.partennneur_choffeur=Partenneur.objects.create (
            user=self.partenneur_user,
            type_compte=self.type_partenneur_choffeur

        )
    def test_no_permission (self):
        self.client=APIClient()
        self.client.force_authenticate(user=self.nopermission)
        response =self.client.patch(self.url)
        self.assertEqual(response.status_code,403)
    def test_no_auth (self):
        self.client=APIClient()
        response =self.client.patch(self.url)
        self.assertEqual(response.status_code ,401)
    def test_succes_200 (self):
        self.client=APIClient()
        self.client.force_authenticate(user=self.commercial)
        response=self.client.put(self.url,data={"id":self.type_partenneur_choffeur.pk,"name":"livreur"},format="json")
        self.assertEqual(response.status_code,200)
        self.type_partenneur_choffeur.refresh_from_db()
        self.assertEqual(self.type_partenneur_choffeur.name,"livreur")
        self.assertEqual(response.json()["message"],"Type de compte mis à jour avec succès")
    def test_inavlide_id (self):
        self.client=APIClient()
        self.client.force_authenticate(user=self.commercial)
        response=self.client.put(self.url,data={"id":99999,"name":"livreur"},format="json")
        self.assertEqual(response.status_code,404)
        self.assertEqual(response.json()["detail"],"Not found")

    def test_invalide_input (self):
        self.client=APIClient()
        self.client.force_authenticate(user=self.commercial)
        response=self.client.put(self.url,data={"id":self.type_partenneur_choffeur.id},format="json")
        self.assertEqual(response.status_code ,400)


class ListeSuperViseurTestCase(APITestCase):
    def setUp(self):  
        self.comm = CustomUser.objects.create(
            username="superviseur",
            password="TestSuperviseur2000",
            email="superviseur@gmail.com",
            phone_number_1="+213672463630",  
            role="gestion_commercial"
        )
        self.no_permission = CustomUser.objects.create(  
            username="TestTest2000",
            password="TestSuperviseur2000",
            email="supervisseur@gmail.com",
            phone_number_1="+213672463630",
            role="client"
        )
        self.superviseur = CustomUser.objects.create(
            username="TestTest2001",
            password="TestSuperviseur2000",
            email="supervisseur@gmailL.com",  
            phone_number_1="+213672463631",
            role="superviseur"
        )
        self.superviseur2 = CustomUser.objects.create(  
            username="TestTest2002", 
            password="TestSuperviseuSSr2000",  
            email="supervisseur@gmailK.com",  
            phone_number_1="+213672463632",
            role="superviseur"
        )
        self.url=reverse("liste_user_suppers")

    def test_no_auth_401(self):  
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, 401)

    def test_no_permission_403(self):  
        client = APIClient()  
        client.force_authenticate(user=self.no_permission)  
        response = client.get(self.url)
        self.assertEqual(response.status_code, 403)

    def test_success_200(self):
        client = APIClient()
        client.force_authenticate(user=self.comm)
        response = client.get(self.url)  
        
        self.assertEqual(response.status_code, 200)
        
        response_data = response.json()
        
        if isinstance(response_data, list):  #
            self.assertEqual(len(response_data), 2)  
        
            
        if isinstance(response_data, dict):
            for superviseur in response_data["results"]:
                self.assertEqual(superviseur["role"], "superviseur")

    def test_search_with_phone_number(self):  
        client = APIClient()
        client.force_authenticate(user=self.comm)
        
        search_url = f"{self.url}?search={self.superviseur.phone_number_1}"  
                   
        
        response = client.get(search_url)
        
        self.assertEqual(response.status_code, 200)
                    
        response_data = response.json()
        if isinstance(response_data, list) and len(response_data) > 0:
                        first_result = response_data[0]
                        self.assertEqual(first_result["phone_number_1"], 
                                       self.superviseur.phone_number_1)
                        if isinstance(first_result, dict):
                            self.assertEqual(len(first_result), 
                                           len(CustomUser._meta.fields))   



class CreateSuperVsieurCommercial (APITestCase):
    def setUp(self):
        self.url=reverse("create_superviseur_commercial")
        self.comm =CustomUser.objects.create (
            username="commmmmm",
            phone_number_1="+213672463230",
            email="comm@gmail.com",
            role="gestion_commercial",

        )
        self.nopermission =CustomUser.objects.create (
            username="sdhjkfhsdkj",
            email="usernmae@gmaisdfsdl.com",
            phone_number_1="213672463235",
            role="client"
        )
    def test_no_auth (self):
        self.client=APIClient()
        response =self.client.post(self.url)
        self.assertEqual(response.status_code,401)

    def test_no_permisiion (self):
        self.client=APIClient()
        self.client.force_authenticate(user=self.nopermission)
        response = self.client.post(self.url)
        self.assertEqual(response.status_code ,403)
    def test_succes_create_superviseur(self):
        self.client=APIClient()
        self.client.force_authenticate(user=self.comm)
        data={


            "username":"superviseur",
           "password":"TestSuperviseur2000",
            "email":"superviseur@gmail.com",
            "phone_number_1":"+213672463630",  
            "role":"superviseur"


        }
        
        response = self.client.post(self.url,data=data,format="json")
        print (f"eroooor is : {response.json()}")
        self.assertEqual(response.status_code,201)
        superv=CustomUser.objects.get(username="superviseur")
        self.assertEqual(superv.role,"superviseur")



    def test_400_create_supper(self):
        self.client=APIClient()
        self.client.force_authenticate(user=self.comm)
        
        data={

           "username":"superviseur",
           "password":"TestSuperviseur2000",
            "email":"superviseur@gmail.com",
            
            "role":"superviseur"
        }
        response=self.client.post(self.url,data=data,format="json")
        

        self.assertEqual(response.status_code,400)
    def test_bad_method (self) :
        self.client=APIClient()
        self.client.force_authenticate(user=self.comm)
        response =self.client.get(self.url)
        self.assertEqual(response.status_code,405)


class AddTypeCompteTestCase(APITestCase):
    def setUp(self):
        
        self.commercial = CustomUser.objects.create(
            username="commercial",
            email="commerciel@gmail.com",
            phone_number_1="+213672463690",
            role="gestion_commercial",
        )
        self.nopermision =CustomUser.objects.create(
            username="noppermos",
            email="nopermooss@gmail.com",
            phone_number_1="+213672463695",
            role="client"
        )
        self.url=reverse("ajouter_type_compte")

    def test_no_auth (self):
        self.client=APIClient()
        reposne =self.client.post(self.url)
        self.assertEqual(reposne.status_code,401)
    def test_nopermission (self):
        self.client=APIClient()
        self.client.force_authenticate(user=self.nopermision)
        response =self.client.post(self.url)
        self.assertEqual(response.status_code,403)
    def test_invalide_jsonbody_400 (self):
        self.client=APIClient()
        self.client.force_authenticate(user=self.commercial)
        response =self.client.post(self.url,{
            "nom":"test","descrption":"gfgfg"
        },format="json")
        self.assertEqual(response.status_code ,400)
        self.assertEqual(response.json()["message"],"tout les infomations obliger  is required")
    def test_create_type_de_compte_200 (self) :
        self.client=APIClient()
        self.client.force_authenticate(user=self.commercial)
        response =self.client.post(self.url,
                         {
                             "nom":"testtetstetstetts",
                             "descrption":"descrption",
                             "tax":"19"
                         },format="json")
        print (f"response : {response.json()["message"]}")
        self.assertEqual(response.status_code,201)
        self.assertEqual(response.json()["message"],"type compte is create")

class GetAllTypeDeCompteTestCase(APITestCase):
    def setUp(self):
        self.url = reverse("get_all_type_compte")

        self.commercial = CustomUser.objects.create_user(
            username="com_user",
            email="commercial@gmail.com",
            phone_number_1="+213672463690",
            role="gestion_commercial",
            password="password123"
        )

        self.client_user = CustomUser.objects.create_user(
            username="client_user",
            email="client@gmail.com",
            phone_number_1="+213672463691",
            role="client",
            password="password123"
        )

        # Create some Type_compte_partener instances
        self.type1 = Type_compte_partener.objects.create(name="Type A", description="Desc A", tax_tawsile=10)
        self.type2 = Type_compte_partener.objects.create(name="Type B", description="Desc B", tax_tawsile=15)
    

    def test_no_auth (self):
        '''test no connect user access to api '''
        self.client=APIClient()
        response=self.client.get(self.url)

        self.assertEqual(response.status_code ,401)

    def test_get_all_types_as_commercial(self):
        """Authorized commercial user should get the list"""
        self.client=APIClient()
        self.client.force_authenticate(user=self.commercial)
        response = self.client.get(self.url)
        types = Type_compte_partener.objects.all()
        expected_data = TypeComptePartenerSerializer(types, many=True).data

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.json(), expected_data)

    def test_get_all_types_as_non_commercial(self):
        """Client user should be forbidden"""
        self.client.force_authenticate(user=self.client_user)
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_get_all_types_empty_list(self):
        """Return empty list if no types exist"""
        Type_compte_partener.objects.all().delete()
        self.client.force_authenticate(user=self.commercial)
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.json(), [])  # Should be an empty list





    def test_filter_by_groupe(self):
        self.client=APIClient()

        self.client.force_authenticate(user=self.commercial)
        response = self.client.get(self.url, {"groupe": "A"})
        # The endpoint returns a list of type accounts, not users.
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Should return all type accounts (2 in setUp)
        self.assertEqual(len(response.json()), 2)
        # Check that the returned data matches the created types
        names = [t["name"] for t in response.json()]
        self.assertIn("Type A", names)
        self.assertIn("Type B", names)

    def test_filter_by_wilaya(self):
            self.client=APIClient()
            self.client.force_authenticate(user=self.commercial)
            response = self.client.get(self.url, {"wilaya": "06"})
            self.assertEqual(response.status_code, status.HTTP_200_OK)
            # Should return all type accounts (no filtering by wilaya in this endpoint)
            self.assertEqual(len(response.json()), 2)
            names = [t["name"] for t in response.json()]
            self.assertIn("Type A", names)
            self.assertIn("Type B", names)






    def test_method_not_allowed(self):
        self.client=APIClient()
        self.client.force_authenticate(user=self.commercial)
        response = self.client.post(self.url)
        self.assertEqual(response.status_code, status.HTTP_405_METHOD_NOT_ALLOWED)

# class AddGroupeToUser (TestCase):
#     def setUp(self):
#         self.url=reverse("ajouter_groupe_pour_user")
#         self.centre_appel =CustomUser.objects.create(
#             first_name="Alice", last_name="Smith", email="alice@examplee.com",username="smith1",
#             role="centre_appel", is_active=True, phone_number_1="+213555123456", groupe="A", wilaya_code="16"
#         )
        
#         self.nopermisision =CustomUser.objects.create (
#             username="nnnnnnooo",
#             email="nopermsision@gmail.com",
#             role="client",
#             phone_number_1="+213672463600"
#         )
        


# class VerifyOtpTestCase(TestCase):
#     def setUp(self):
#         self.client = APIClient()
#         self.url = reverse("verifie_otp")  # Make sure this matches your URLconf
#         self.valid_otp = "123456"
#         self.valid_phone = "+213672463690"
        
#         # Set session data
#         session = self.client.session
#         session["otp"] = self.valid_otp
#         session["phone_number"] = self.valid_phone
#         session.save()

#     def test_valid_otp_and_phone(self):
#         """Should return 200 when OTP and phone number match session"""
#         payload = {
#             "otp": self.valid_otp,
#             "num": self.valid_phone
#         }
#         response = self.client.post(self.url, data=json.dumps(payload), content_type="application/json")
#         self.assertEqual(response.status_code, 200)
#         self.assertEqual(response.json()["message"], "OTP verified successfully.")

#             "num": self.valid_phone
#         }
#         response = self.client.post(self.url, data=json.dumps(payload), content_type="application/json")
#         self.assertEqual(response.status_code, 400)



#         payload = {
#             "otp": self.valid_otp,
#             "num": self.valid_phone
#         }
#         response = self.client.post(self.url, data=json.dumps(payload), content_type="application/json")
#         self.assertEqual(response.status_code, 400)
#         self.assertIn("OTP not found", response.json()["error"])

#     def test_invalid_json_format(self):
#         """Should return 400 on invalid JSON"""
#         response = self.client.post(self.url, data="not a json", content_type="application/json")
#         self.assertEqual(response.status_code, 400)
#         self.assertIn("Invalid JSON format", response.json()["error"])

#     def test_get_method_not_allowed(self):
#         """Should return 405 on GET request"""
#         response = self.client.get(self.url)
#         self.assertEqual(response.status_code, 405)
#         self.assertIn("Only POST method is allowed", response.json()["error"])



#     def test_filter_by_groupe(self):
#         self.client=APIClient()
#         self.client.force_authenticate(user=self.centre_appel)
#         response = self.client.get(self.url, {"groupe": "A"})
#         self.assertEqual(response.status_code, status.HTTP_200_OK)
#         self.assertEqual(len(response.data["results"]), 1)
#         self.assertEqual(response.data["results"][0]["email"], "alice@example.com")

#     def test_filter_by_wilaya(self):
#         self.client=APIClient()
#         self.client.force_authenticate(user=self.centre_appel)
#         response = self.client.get(self.url, {"wilaya": "06"})
#         self.assertEqual(response.status_code, status.HTTP_200_OK)
#         self.assertEqual(len(response.data["results"]), 1)
#         self.assertEqual(response.data["results"][0]["email"], "bob@example.com")


#     def test_filter_by_groupe(self):
#         self.client=APIClient()
#         self.client.force_authenticate(user=self.centre_appel)
#         response = self.client.get(self.url, {"groupe": "A"})
#         self.assertEqual(response.status_code, status.HTTP_200_OK)
#         self.assertEqual(len(response.data["results"]), 1)
#         self.assertEqual(response.data["results"][0]["email"], "alice@example.com")

#     def test_filter_by_wilaya(self):
#         self.client=APIClient()
#         self.client.force_authenticate(user=self.centre_appel)
#         response = self.client.get(self.url, {"wilaya": "06"})
#         self.assertEqual(response.status_code, status.HTTP_200_OK)
#         self.assertEqual(len(response.data["results"]), 1)
#         self.assertEqual(response.data["results"][0]["email"], "bob@example.com")

#     def test_filter_by_search_number(self):
#         self.client=APIClient()
#         self.client.force_authenticate(user=self.centre_appel)
#         response = self.client.get(self.url, {"search": "+213555"})
#         self.assertEqual(response.status_code, status.HTTP_200_OK)
#         self.assertEqual(len(response.json()["results"]), 1)
#         self.assertEqual(response.json()["results"][0]["email"], "alice@example.com")

#     def test_filter_by_groupe(self):
#         self.client=APIClient()
#         self.client.force_authenticate(user=self.centre_appel)
#         response = self.client.get(self.url, {"groupe": "A"})
#         self.assertEqual(response.status_code, status.HTTP_200_OK)
#         self.assertEqual(len(response.data["results"]), 1)
#         self.assertEqual(response.data["results"][0]["email"], "alice@example.com")

#     def test_filter_by_wilaya(self):
#         self.client=APIClient()
#         self.client.force_authenticate(user=self.centre_appel)
#         response = self.client.get(self.url, {"wilaya": "06"})
#         self.assertEqual(response.status_code, status.HTTP_200_OK)
#         self.assertEqual(len(response.data["results"]), 1)
#         self.assertEqual(response.data["results"][0]["email"], "bob@example.com")

#     def test_filter_by_search_number(self):
#         self.client=APIClient()
#         self.client.force_authenticate(user=self.centre_appel)
#         response = self.client.get(self.url, {"search": "+213555"})
#         self.assertEqual(response.status_code, status.HTTP_200_OK)
#         self.assertEqual(len(response.json()["results"]), 1)
#         self.assertEqual(response.json()["results"][0]["email"], "alice@example.com")


class AuthParNumTestCase(TestCase):
    def setUp(self):
        self.client = Client()
        self.url = reverse("auth_par_num") 
        self.phone_number = "+213542700534"

    @patch("employer.views.generate_otp", return_value="123456")  # Adjust import path
    @patch("employer.views.send_sms")  # Mock send_sms to prevent actual sending
    def test_valid_phone_number(self, mock_send_sms, mock_generate_otp):
        """Test sending OTP with valid phone number"""
        payload = {"num": self.phone_number}
        response = self.client.post(self.url, data=json.dumps(payload), content_type="application/json")
        
        self.assertEqual(response.status_code, 200)
        self.assertIn("OTP sent", response.json()["message"])
        self.assertEqual(self.client.session["otp"], "123456")
        self.assertEqual(self.client.session["phone_number"], self.phone_number)
        mock_send_sms.assert_called_once_with(self.phone_number, "123456")

    def test_missing_phone_number(self):
        """Should return 400 if phone number is missing"""
        payload = {}
        response = self.client.post(self.url, data=json.dumps(payload), content_type="application/json")
        self.assertEqual(response.status_code, 400)
        self.assertIn("Phone number is required", response.json()["error"])

    def test_invalid_json(self):
        """Should return 400 for bad JSON format"""
        response = self.client.post(self.url, data="not-json", content_type="application/json")
        self.assertEqual(response.status_code, 400)
        self.assertIn("Invalid JSON format", response.json()["error"])

    def test_get_method_not_allowed(self):
        """Should return 405 for non-POST requests"""
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, 405)
        self.assertIn("Only POST method is allowed", response.json()["error"])

    @patch("employer.views.generate_otp", side_effect=Exception("Something broke"))
    def test_internal_server_error(self, mock_generate_otp):
        """Simulate internal error (e.g. send_sms fails)"""
        payload = {"num": self.phone_number}
        response = self.client.post(self.url, data=json.dumps(payload), content_type="application/json")
        self.assertEqual(response.status_code, 500)
        self.assertIn("probleme de connexion", response.json()["error"])





class GetAllChefBureuxTestCase(APITestCase):

    def setUp(self):
        # Create some test users
        self.user1 = CustomUser.objects.create(
            first_name="Alice", last_name="Smith", email="alice@example.com",username="smith1",
            role="chef_bureau", is_active=True, phone_number_1="+213555123456", groupe="A", wilaya_code="16"
        )
        self.user2 = CustomUser.objects.create(
            first_name="Bob", last_name="Jones", email="bob@example.com",username="smith2",
            role="chef_bureau", is_active=True, phone_number_1="+213666123456", groupe="B", wilaya_code="06"
        )
        self.user3 = CustomUser.objects.create(
            first_name="Inactive", last_name="Guy", email="inactive@example.com",username="smith3",
            role="chef_bureau", is_active=False, phone_number_1="+213777123456", groupe="A", wilaya_code="16"
        )
        self.centre_appel =CustomUser.objects.create(
            first_name="Inactive", last_name="Guy", email="inactive@example.com",username="smith4",
            role="centre_appel", is_active=False, phone_number_1="+213777123456", groupe="A", wilaya_code="16")

        self.url = reverse("get_all_chef_bureux")  # update if your view has a different name

    def test_get_all_chef_bureux_success(self):
        self.client=APIClient()
        self.client.force_authenticate(user=self.centre_appel)
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data["results"]), 2)  # only active ones

    def test_filter_by_groupe(self):
        self.client=APIClient()
        self.client.force_authenticate(user=self.centre_appel)
        response = self.client.get(self.url, {"groupe": "A"})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data["results"]), 1)
        self.assertEqual(response.data["results"][0]["email"], "alice@example.com")

    def test_filter_by_wilaya(self):
        self.client=APIClient()
        self.client.force_authenticate(user=self.centre_appel)
        response = self.client.get(self.url, {"wilaya": "06"})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data["results"]), 1)
        self.assertEqual(response.data["results"][0]["email"], "bob@example.com")

    def test_filter_by_search_number(self):
        self.client=APIClient()
        self.client.force_authenticate(user=self.centre_appel)
        response = self.client.get(self.url, {"search": "+213555"})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.json()["results"]), 1)
        self.assertEqual(response.json()["results"][0]["email"], "alice@example.com")

    def test_method_not_allowed(self):
        self.client=APIClient()
        self.client.force_authenticate(user=self.centre_appel)
        response = self.client.post(self.url)
        self.assertEqual(response.status_code, status.HTTP_405_METHOD_NOT_ALLOWED)

class AddGroupeToUser (TestCase):
    def setUp(self):
        self.url=reverse("ajouter_groupe_pour_user")
        self.centre_appel =CustomUser.objects.create(
            first_name="Alice", last_name="Smith", email="alice@examplee.com",username="smith1",
            role="centre_appel", is_active=True, phone_number_1="+213555123456", groupe="A", wilaya_code="16"
        )
        
        self.nopermisision =CustomUser.objects.create (
            username="nnnnnnooo",
            email="nopermsision@gmail.com",
            role="client",
            phone_number_1="+213672463600"
        )
        self.partenneur =CustomUser.objects.create(
            first_name="Alice", last_name="Smith", email="partenneuralice@examplee.com",username="partennneur200",
            role="client", is_active=True, phone_number_1="+213555123450", wilaya_code=16
        )
    def nopermission (self):
        self.client=APIClient()
        self.client.force_authenticate(user=self.nopermisision)
        response =self.client.post(self.url)
        self.assertEqual(response.status_code,403)
    def test_no_auth (self):
        self.client=APIClient()
        response =self.client.patch(self.url)
        self.assertEqual(response.status_code,401)
    # def test_invalide_input (self):
    #     self.client=APIClient()
    #     self.client.force_authenticate(user=self.centre_appel)
    #     response =self.client.patch(self.url,data={
    #         "groupe":"G1",
    #         "id":self.centre_appel.pk,
    #         "wilaya":None  
    #     },format='json')
    #     print (f"response message is {response.json()}")
    #     self.assertEqual(response.status_code,400)
    #     self.assertEqual(response.json()["message"],"code et groupe et wilaya obligatoire")
    def test_inavlide_user_id (self):

        self.client=APIClient()
        self.client.force_authenticate(user=self.centre_appel)
        


        response =self.client.patch(self.url,data={
            "groupe":16,
            "id":99999,
            "wilaya":"algerie",
            
        },format='json')
        self.assertEqual(response.status_code,404)


        
        
    
    # def test_success_200 (self):
    #     self.client=APIClient()
    #     self.client.force_authenticate(user=self.centre_appel)
        
    #     response =self.client.patch(self.url,data={
    #         "groupe":10,
    #         "id":self.partenneur.pk,
    #         "wilaya":"alegrie",
    #         "code":16
    #     },format='json')
    #     print (f"response message is {response.json()}")
        
    #     self.assertEqual(response.status_code,200)
    #     self.assertEqual(response.json()["message"],"vous avez ajouter le groupe a utilisateur")
    #     self.partenneur.refresh_from_db()
    #     self.assertEqual(self.partenneur.groupe, 10)

    

class HistoriqueDeCassieParChefBureuxTests(APITestCase):
    def setUp(self):
        self.client = APIClient()
        self.url = reverse('historique_de_cassie_par_chef_bureux')
        self.user = CustomUser.objects.create_user(
            username='testchef',
            password='Tesssestpass123',
            email='wailammar@gmail.com',
            role='chef_bureau',
            groupe=1
        )
        self.cassie1 = Cassie.objects.create(
            chef_bu=self.user,
            date_creationn=now()
        )
        self.cassie2 = Cassie.objects.create(
            chef_bu=self.user,
            date_creationn=now()
        )
        self.nopermission = CustomUser.objects.create_user(
            username='CLIENT',
            password='ttstpass1234',
            email='wailammar@gmddail.com',
            role='client',
            groupe=1
        )

    def test_unauthenticated_request(self):
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
    def test_no_permission (self):
        self.client=APIClient()
        self.client.force_authenticate(user=self.nopermission)
        response =self.client.get(self.url)
        self.assertEqual(response.status_code,403)

    def test_authenticated_request_without_date_filter(self):
        self.client=APIClient()
        self.client.force_authenticate(user=self.user)
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 2)

    # def test_authenticated_request_with_valid_date_filter(self):
    #     self.client=APIClient()
    #     self.client.force_authenticate(user=self.user)
    #     search_date = self.cassie1.date_creationn.strftime('%Y-%m-%d')
    #     response = self.client.get(self.url, {'search_date': search_date})
    #     self.assertEqual(response.status_code, status.HTTP_200_OK)
    #     self.assertEqual(len(response.data['results']), 1)

    def test_authenticated_request_with_invalid_date_filter(self):
        self.client=APIClient()
        self.client.force_authenticate(user=self.user)
        response = self.client.get(self.url, {'search_date': 'invalid-date'})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('error', response.data)

    def test_pagination(self):
        self.client=APIClient()
        self.client.force_authenticate(user=self.user)
        response = self.client.get(self.url, {'page': 1})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('count', response.data)
        self.assertIn('total_pages', response.data)
        self.assertIn('current_page', response.data)


class OuvrirCasseComtable(APITestCase):
    def setUp(self):
        self.url=reverse("api_ouvrir_la_casse_comptable")
        self.chef=CustomUser.objects.create (
            username="comtable",
            email='comtabmle@gmail.com',
            phone_number_1="+213672463630",
            role="chef_bureau",
            password='password',
            permission_vlider=False
            
        )
        self.chef.groupe=self.chef.pk
        self.chef.save()
        self.nopermission =CustomUser.objects.create (
            username="client",
            email='client@gmail.com',
            phone_number_1="+213672463631",
            role="client",
            password="password"
        )
        self.agent= CustomUser.objects.create (
            username="agent",
            email="agent@gmail.com",
            password="password",
            role="agent_administratif",
            groupe=self.chef.pk,
            permission_vlider=False
        )
    def test_no_auth (self):
        self.client=APIClient()
        response =self.client.patch(self.url)
        self.assertEqual(response.status_code,401)
    def test_nopermisssion (self):
        self.client=APIClient()
        self.client.force_authenticate(user=self.nopermission)
        response =self.client.patch(self.url)
        self.assertEqual(response.status_code,403)
    def test_success_ouvir (self):
        self.client=APIClient()
        self.client.force_authenticate(user=self.chef)
        resposne =self.client.patch(self.url)
        self.chef.refresh_from_db()
        self.agent.refresh_from_db()
        
        self.assertEqual(resposne.status_code,200)
        self.assertTrue(Cassie.objects.get(chef_bu=self.chef))
        self.assertTrue(self.chef.permission_vlider)
        self.assertTrue(self.agent.permission_vlider)
        
    
    def test_casse_deja_ouverrt (self):
        self.client=APIClient()
        self.client.force_authenticate(user=self.chef)
        self.casse =Cassie.objects.create(
            chef_bu=self.chef,
            date_creationn=date.today(),
            etat=True
            
        )
        response =self.client.patch (self.url)
        self.assertEqual(response.status_code,409)
        
class AretteCasseChefBureuxUseCase(APITestCase):
    def setUp(self):
        
        self.chef=CustomUser.objects.create (
            username="chef_bureux",
            email="chef_bureux@gmail.com",
            password="pasword",
            role="chef_bureau",
            phone_number_1="+213672463630",
            permission_vlider=True,
            
        )
        self.chef.groupe = self.chef.pk
        self.chef.permission_vlider=True
        self.chef.save()
        self.chef.refresh_from_db()
        print (f"groupe de chef bureux is : {self.chef}")
        self.nopermission = CustomUser.objects.create(
            username="client",
            email="client@gmail.com",
            password="password",
            role="client",
            phone_number_1="+213672463631"
            
        )
        self.casse :Cassie = Cassie.objects.create(
            chef_bu=self.chef,
            date_creationn=now(),
            etat=True
        )
        self.agent =CustomUser.objects.create (
            username="agent",
            email="agent@gmail.com",
            password="agent",
            phone_number_1="+213672463637",
            role="agent_administratif",
            groupe=self.chef.pk,
            
            
        )
        self.action1:Actions =Actions.objects.create (
            agent=self.chef,
            date_action=date.today(),
            total_amount=100,
            livreur=None
        )
        self.action2:Actions =Actions.objects.create(
            agent=self.chef,
            date_action=date.today(),
            total_amount=100,
            livreur=None
        )
        
        
       
        self.url=reverse("arret_casse_chef")
    def test_no_auth (self):
        self.client=APIClient()
        response =self.client.patch(self.url)
        self.assertEqual(response.status_code,401)
    def test_nopermission (self):
        self.client=APIClient()
        self.client.force_authenticate(user=self.nopermission)
        response =self.client.patch(self.url)
        self.assertEqual(response.status_code,403)
    def test_success_arret_casse (self):
        self.client=APIClient()
        self.client.force_authenticate(user=self.chef)
        self.client.force_authenticate(user=self.chef)
        response =self.client.post(self.url,data={
            "prix":1200,
            "acompte":2300
        },format="json")
        self.assertEqual(response.status_code,200)
        self.casse.refresh_from_db()
        self.assertFalse(self.casse.etat)
        self.assertEqual(self.casse.prix_reale, 1200)
        self.assertEqual(self.casse.a_compte, 2300)
        self.assertTrue(self.chef.permission_vlider)
        self.assertFalse(self.agent.permission_vlider)
        
        
    def test_casse_deja_arrete (self):
        self.client=APIClient()
        self.client.force_authenticate(user=self.chef)
        self.casse.etat = False
        self.casse.save()
        self.casse.refresh_from_db()
        response =self.client.post(self.url,data={
            "prix":1200,
            "acompte":2300
        },format="json")
        
        self.assertEqual(response.status_code,409)
        self.assertEqual(response.json()["message"],"La caisse est déjà fermée")
        self.assertEqual(self.casse.etat, False)
        
    def test_invalide_data (self):
        self.client=APIClient()
        self.client.force_authenticate(user=self.chef)
        response =self.client.post(self.url,data={
            "prix":None,
            
        },format="json")
        self.assertEqual(response.status_code,400)
        self.assertEqual(response.json()["message"],"Le prix est requis")
        
        
class ValidePyamentTestCase (APITestCase):
    def setUp(self):
        self.url=reverse("valider_payment_commande")
        self.chef=CustomUser.objects.create (
            username="chef_bureux",
            email="chef_bureux@gmail.com",
            password="pasword",
            role="chef_bureau",
            phone_number_1="+213672463630",
            permission_vlider=True,
            
        )
        self.agent=CustomUser.objects.create (
            username="agent",
            email="agent@gmail.com",
            password="pasword",
            role="agent_administratif",
            phone_number_1="+213672463631",
            permission_vlider=True,
        )
        self.agent2=CustomUser.objects.create (
            username="agent2",
            email="agent2@gmail.com",
            password="pasword",
            role="agent_administratif",
            phone_number_1="+213672463632",
            permission_vlider=False,
        )
        
        self.nopermission = CustomUser.objects.create(
            username="client",
            email="client@gmail.com",
            password="password",
            role="client",
            phone_number_1="+213672463631"
            
        )
        # Create required related objects for Commande
        self.client_user = CustomUser.objects.create_user(
            username="commande_client",
            password="TestCommandeClient2000",
            role="client",
            phone_number_1="+213672463699",
            email="commandeclient@example.com",
            wilaya_code=16
        )
        self.type_compte =Type_compte_partener.objects.create (
            name="magasin",
            tax_tawsile=0,
            description="test"
            
        )
        self.magasin_owner = CustomUser.objects.create_user(
            username="magasin_owner",
            password="TestMagasinOwner2000",
            role="partener",
            phone_number_1="+213672463698",
            email="magasinowner@example.com",
            wilaya_code=16
            
            
        )
        self.paretnneur =Partenneur.objects.create(
        user=self.magasin_owner,
        type_compte=self.type_compte
        )
        self.magasin = Magasin.objects.create(
            owner=self.paretnneur,
            name="Test Magasin",
            address="123 Rue Test"
        )
        self.livreur_user = CustomUser.objects.create_user(
            username="commande_livreur",
            password="TestCommandeLivreur2000",
            role="livreur",
            phone_number_1="+213672463697",
            email="commandelivreur@example.com",
            wilaya_code=16
        )
        self.type_compte_livreur =Type_compte_partener.objects.create (
            name="livreur",
            tax_tawsile=0,
            description="test"
            
        )
        self.paretnneur_livreur=Partenneur.objects.create (
            user=self.livreur_user,
            type_compte=self.type_compte_livreur
            
        )
        self.livreur = Livreur.objects.create(
            partenneur=self.paretnneur_livreur
            
        )
        self.commande = Commande.objects.create(
            client=self.client_user,
            magasin=self.magasin,
            livreur=self.livreur,
            total_price=1000.00,
            delivery_price=200.00,
            status='pending',
            type_livraison='classique',
            valide_payment=False
        )
        self.commande2 = Commande.objects.create(
            client=self.client_user,
            magasin=self.magasin,
            livreur=self.livreur,
            total_price=1000.00,
            delivery_price=200.00,
            status='pending',
            type_livraison='classique',
            valide_payment=True
        )
    def test_not_permission (self):
        self.client=APIClient()
        self.client.force_authenticate(user=self.nopermission)
        response =self.client.post(self.url)
        self.assertEqual(response.status_code,403)
    def test_no_auth(self):
        self.client=APIClient()
        response =self.client.post(self.url)
        self.assertEqual(response.status_code,401)
        
        
    def test_casse_arret (self):
        self.client=APIClient(  )
        self.client.force_authenticate(user=self.agent2)
        self.casse =Cassie.objects.create (
            etat=False,
            chef_bu=self.chef
            
            
        )
        response =self.client.post(self.url,data={"id":self.casse.pk},format="json")
        print (f"test casse arret error : {response.json()}")
        self.assertEqual(response.status_code,400)
        self.assertEqual(response.json()["message"],"Le cas est arrêté")
        
        
    def test_success_valide_payment (self):
     self.client=APIClient()
     self.client.force_authenticate(user=self.agent)
     response=self.client.post(self.url,data={
         "id":[self.commande.pk]
     },format="json")
     
     self.assertEqual(response.status_code,200)
     self.commande.refresh_from_db()
     self.assertTrue(self.commande.valide_payment)
     self.assertEqual(response.json()["message"],"Commandes updated successfully")
     self.assertEqual(self.commande.emp_val.pk,self.agent.pk)
    def test_invalide_id (self):
        self.client=APIClient()
        self.client.force_authenticate(user=self.agent)
        response =self.client.post(self.url,data={
            "id":[999999]
        },format="json")
        self.assertEqual(response.status_code,404)
        
        
    def test_commande_deja_valide(self):
        self.client=APIClient()
        self.client.force_authenticate(user=self.agent)
        response =self.client.post(self.url,data={
            "id":self.commande2
        },format="json")
        self.assertEqual(response.status_code,400)
        self.assertEqual(response.json()["message"],"ces commandes est deja validé")
    
     
        
        
    
        

    
        


        
    

        




        


    
    