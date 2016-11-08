import os

from hexifier import DockerAuthConfigHexifier
from exhibitor import Exhibitor


class LoadBalancerApp(object):
    """
    NGINX load balancer functionality
    """
    APP_ID = '/external-nginx-lb'
    JSON_FILE = 'conf/external-nginx-lb.json'

    def __init__(self, marathon_helper):
        self.marathon_helper = marathon_helper

    def ensure_exists(self, compose_data):
        """
        Checks if compose file has label that requires NGINX
        to be install and ensures it is installed
        """
        for _, service_info in compose_data['services'].items():
            if 'labels' in service_info:
                for label in service_info['labels']:
                    if label.startswith('com.microsoft.acs.dcos.marathon.vhost'):
                        self.marathon_helper.ensure_exists(Exhibitor.APP_ID, Exhibitor.JSON_FILE)
                        self._install()

    def _install(self):
        """
        Installs NGINX load balancer. Checks if NGINX is not installed yet
        then deploys the nginx.conf template first, and deploys the NGINX app.
        """
        if not self.marathon_helper.app_exists(LoadBalancerApp.APP_ID):
            self.marathon_helper.ensure_exists(LoadBalancerApp.APP_ID, LoadBalancerApp.JSON_FILE)
