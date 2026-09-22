import instaloader
import ssl

ssl._create_default_https_context = ssl._create_unverified_context

L = instaloader.Instaloader()
L.context._session.verify = False

try:
    print("Trying to fetch highlight 17844350480355846...")
    # instaloader get_highlight_from_id requires a Highlight object or raw query
    # Instaloader can fetch highlights by target user or highlight id
    # Highlight id: 17844350480355846
    # Let's test get_stories or story item
    print("Instaloader initialized.")
except Exception as e:
    print("Instaloader Error:", type(e), e)
