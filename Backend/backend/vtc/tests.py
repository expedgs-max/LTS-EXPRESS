from channels.testing import WebsocketCommunicator
from vtc.consumers import *

from employer.models import *


from channels.db import database_sync_to_async
import json
import pytest
        
# Helper function to create test users
@pytest.mark.usefixtures("db_class")
def create_test_user(username, password, **kwargs):
    user = CustomUser.objects.create_user(username=username, password=password, **kwargs)
    return user

# Helper function to create a test partner
@pytest.mark.usefixtures("db_class")
def create_test_partner(user, **kwargs):
    vihucule = Vihucule.objects.create(marque="Toyota", modele="Corolla", matricule="123ABC")
    partner = Partenneur.objects.create(user=user, vihucule=vihucule, **kwargs)
    return partner

# Helper function to create a test Coursa
@pytest.mark.usefixtures("db_class")
def create_test_coursa(client, partner, **kwargs):
    coursa = Coursa.objects.create(client=client, partener=partner, **kwargs)
    return coursa
@pytest.mark.asyncio
@pytest.mark.django_db
async def test_client_consumer_connect():
    # Create a test client user
    user = await create_test_user(username="client1", password="testpass123", wilaya_code="16")

    # Simulate WebSocket connection
    communicator = WebsocketCommunicator(ClientConsumer, "/ws/client/")
    communicator.scope["user"] = user
    connected, _ = await communicator.connect()
    assert connected

    # Test receiving a location prompt
    response = await communicator.receive_json_from()
    assert response["type"] == "location_prompt"
    assert response["message"] == "Please enter your aller (departure) and arriver (arrival) locations."

    # Clean up
    await communicator.disconnect()

@pytest.mark.asyncio
@pytest.mark.django_db
async def test_client_consumer_ride_request():
    # Create a test client user
    user = await create_test_user(username="client1", password="testpass123", wilaya_code="16")

    # Simulate WebSocket connection
    communicator = WebsocketCommunicator(ClientConsumer, "ws/client/commandes/")
    communicator.scope["user"] = user
    await communicator.connect()

    # Send a ride request
    ride_data = {
        "type": "ride_request",
        "ride_data": {
            "depart": {"region": "Region A", "location": "Location X"},
            "arrive": {"region": "Region B", "location": "Location Y"},
            "pickup_location_lat": "36.123456",
            "pickup_location_long": "2.654321",
            "dropoff_location_lat": "36.654321",
            "dropoff_location_long": "2.123456",
        },
        "km": "10",
        "prix": "1000",
        "type_vihucule": "car",
        "seats": "4",
        "whom_the_trip_for": "family",
        "duration": "30",
    }
    await communicator.send_json_to(ride_data)

    # Check if the ride request is broadcasted (you can mock the channel layer for this)
    response = await communicator.receive_json_from()
    assert response["type"] == "ride_accepted" or response["type"] == "ride_rejected"

    # Clean up
    await communicator.disconnect()
@pytest.mark.asyncio
@pytest.mark.django_db
async def test_partner_consumer_connect():
    # Create a test partner user
    user = await create_test_user(username="partner1", password="testpass123", wilaya_code="16")
    partner = await create_test_partner(user, latitude="36.123456", longitude="2.654321")

    # Simulate WebSocket connection
    communicator = WebsocketCommunicator(PartnerConsumer, "/ws/partner/")
    communicator.scope["user"] = user
    connected, _ = await communicator.connect()
    assert connected

    # Clean up
    await communicator.disconnect()

@pytest.mark.asyncio
@pytest.mark.django_db
async def test_partner_consumer_accept_ride():
    # Create a test client and partner
    client_user = await create_test_user(username="client1", password="testpass123", wilaya_code="16")
    partner_user = await create_test_user(username="partner1", password="testpass123", wilaya_code="16")
    partner = await create_test_partner(partner_user, latitude="36.123456", longitude="2.654321")

    # Simulate WebSocket connection for partner
    communicator = WebsocketCommunicator(PartnerConsumer, "/ws/partner/")
    communicator.scope["user"] = partner_user
    await communicator.connect()

    # Send a ride acceptance message
    ride_data = {
        "type": "accept_ride",
        "ride_data": {
            "depart": {"region": "Region A", "location": "Location X"},
            "arrive": {"region": "Region B", "location": "Location Y"},
            "pickup_location_lat": "36.123456",
            "pickup_location_long": "2.654321",
            "dropoff_location_lat": "36.654321",
            "dropoff_location_long": "2.123456",
        },
        "client_id": client_user.id,
        "km": "10",
        "prix": "1000",
        "duration": "30",
    }
    await communicator.send_json_to(ride_data)

    # Check if the ride is created and the client is notified
    response = await communicator.receive_json_from()
    assert response["type"] == "ride_accepted"
    assert response["coursa_id"] is not None

    # Clean up
    await communicator.disconnect()
@pytest.mark.asyncio
@pytest.mark.django_db
async def test_ride_tracking_consumer():
    # Create a test client, partner, and Coursa
    client_user = await create_test_user(username="client1", password="testpass123", wilaya_code="16")
    partner_user = await create_test_user(username="partner1", password="testpass123", wilaya_code="16")
    partner = await create_test_partner(partner_user, latitude="36.123456", longitude="2.654321")
    coursa = await create_test_coursa(client_user, partner, etat="en_cours")

    # Simulate WebSocket connection for ride tracking
    communicator = WebsocketCommunicator(RideTrackingConsumer, f"/ws/ride/{coursa.id}/")
    connected, _ = await communicator.connect()
    assert connected

    # Check if the current ride state is sent
    response = await communicator.receive_json_from()
    assert response["id"] == coursa.id
    assert response["etat"] == "en_cours"

    # Clean up
    await communicator.disconnect()