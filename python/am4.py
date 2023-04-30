import datetime
import sys
import time
from selenium import webdriver
from selenium.webdriver.firefox.options import Options
from termcolor import cprint
from time import sleep


class AirlineManager4Bot:
    # config
    fuelPriceThreshold = 550
    co2PriceThreshold = 125

    # constants
    f = open("creds", "r")
    lines = f.readlines()
    username = lines[0].strip(' \t\n\r')
    password = lines[1].strip(' \t\n\r')
    f.close()
    firefox = 'geckodriver'
    url = 'https://www.airlinemanager.com/'

    # xpath
    xbtnlogin = '/html/body/div[4]/div/div[2]/div[1]/div/button[2]'
    xtbusername = '//*[@id="lEmail"]'
    xtbpassword = '//*[@id="lPass"]'
    xcbremember = '//*[@id="remember"]'
    xbtnauth = '//*[@id="btnLogin"]'

    xbtndepart = '//*[@id="listDepartAll"]/div/button[2]'
    xdepartamount = '//*[@id="listDepartAmount"]'

    xbtnfinance = '/html/body/div[10]/div/div[4]/div[5]/div'
    xbtnmarketing = '/html/body/div[8]/div/div/div[3]/div[1]/button[2]'

    xactivecampaign = '//*[@id="active-campaigns"]/div'
    xbtnnewcampaign = '//*[@id="newCampaign"]'
    xtablecampaign = '//*[@id="active-campaigns"]/table/tbody'
    xbtnpopupclose = '//*[@id="popup"]/div/div/div[1]/div/span'

    xbtnfuel = '/html/body/div[10]/div/div[4]/div[3]/div'
    xlbpricefuel = '//*[@id="fuelMain"]/div/div[1]/span[2]/b'
    xbtnclose = '//*[@id="popup"]/div/div/div[1]/div/span'
    xtbfuelprice = '//*[@id="amountInput"]'
    xbtnbuyfuel = '//*[@id="fuelMain"]/div/div[7]/div/button[2]'
    xcapacity = '//*[@id="remCapacity"]'

    xbtnco2 = '//*[@id="popBtn2"]'
    xlbco2price = '//*[@id="co2Main"]/div/div[2]/span[2]/b'
    xtbco2price = '//*[@id="amountInput"]'
    xbtnbuyco2 = '//*[@id="co2Main"]/div/div[8]/div/button[2]'

    # xbtndepartures = '//*[@id="mapRoutes"]/img'
    # xbtndepartall = '//*[@id="departAll"]'

    def __init__(self):
        options = Options()
        options.add_argument("--log-level=3")
        options.add_argument('--headless')
        self.driver = webdriver.Firefox(executable_path=self.firefox, options=options)
        self.launcher()

    def launcher(self):
        self.login()

        sleep(3)

        while True:
            try:
                # Check if it's between 00:00 and 08:00
                if datetime.time(0, 0, 0) <= datetime.datetime.now().time() <= datetime.time(8, 0, 0):
                    # Calculate the difference in seconds between now and 8:00
                    now_time = datetime.datetime.now().time()
                    target_time = datetime.time(8, 0, 0)
                    difference = (datetime.datetime.combine(datetime.date.today(),
                                                            target_time) - datetime.datetime.combine(
                        datetime.date.today(), now_time)).total_seconds()
                    # Sleep until 8:00
                    save_log(get_time() + " Sleeping until 8:00 ! ({time} seconds)".format(time=difference), "red")
                    sleep(difference)

                # Check campaign status
                campaign_status = self.campaign_status()

                # start campaign if needed
                if campaign_status == "bad":
                    self.start_eco_campaign()
                    sleep(1)
                    self.start_rep_campaign()
                    sleep(1)

                # launch plane
                self.depart_all()

                # check fuel + co2
                self.fuel()
                self.co2()

            except Exception as e:
                save_log(get_time() + "Following failure happened : \n {}".format(e), "red")
            # sleep
            sleep(60 * 6)

    def login(self):
        try:
            self.driver.get(self.url)

            sleep(1)

            btnlogin = self.driver.find_element_by_xpath(self.xbtnlogin)
            btnlogin.click()

            tbusername = self.driver.find_element_by_xpath(self.xtbusername)
            tbusername.send_keys(self.username)

            tbpassword = self.driver.find_element_by_xpath(self.xtbpassword)
            tbpassword.send_keys(self.password)

            cbremember = self.driver.find_element_by_xpath(self.xcbremember)
            cbremember.click()

            btnauth = self.driver.find_element_by_xpath(self.xbtnauth)
            btnauth.click()
            sleep(2)

            save_log(get_time() + " Login succesfully from user {username}!".format(username=self.username), "green")

        except:
            save_log(get_time() + " Login function error!", "red")
        return

    def fuel(self):
        try:
            btnfuel = self.driver.find_element_by_xpath(self.xbtnfuel)
            btnfuel.click()
            sleep(2)

            pricefuel = self.driver.find_element_by_xpath(self.xlbpricefuel).text
            pricefuel = pricefuel.replace("$ ", "")
            pricefuel = pricefuel.replace(",", "")
            pricefuel = int(pricefuel)

            save_log(get_time() + "[!] Fuel price --> {pricefuel}".format(pricefuel=pricefuel), "yellow")

            if pricefuel <= self.fuelPriceThreshold:
                capacity = self.buy()
                save_log(get_time() + "[+] Purchased {quantityfuel} fuel!".format(quantityfuel=capacity),
                         "green")
                sleep(2)

            self.driver.find_element_by_xpath(self.xbtnclose).click()
            sleep(2)

        except:
            save_log(get_time() + "[-] Fuel function error!", "red")
            self.driver.find_element_by_xpath(self.xbtnclose).click()

    #
    def co2(self):
        try:
            self.driver.find_element_by_xpath(self.xbtnfuel).click()
            sleep(2)

            self.driver.find_element_by_xpath(self.xbtnco2).click()
            sleep(2)

            priceco2 = self.driver.find_element_by_xpath(self.xlbco2price).text.replace("$ ", "")
            priceco2 = int(priceco2)

            save_log(get_time() + "[!] CO2 price --> {priceco2}".format(priceco2=priceco2), "yellow")

            if priceco2 <= self.co2PriceThreshold:
                capacity = self.buy()
                save_log(get_time() + "[+] Purchased {quantityco2} CO2!".format(quantityco2=capacity), "green")
                sleep(2)

            self.driver.find_element_by_xpath(self.xbtnclose).click()
            sleep(2)

        except:
            save_log(get_time() + "[-] CO2 function error!", "red")
            self.driver.find_element_by_xpath(self.xbtnclose).click()

    def buy(self):
        capacity = self.driver.find_element_by_xpath(self.xcapacity).text.replace(",", "")
        capacity = int(capacity)
        tbco2price = self.driver.find_element_by_xpath(self.xtbco2price)
        tbco2price.clear()
        tbco2price.send_keys(capacity)
        self.driver.find_element_by_xpath(self.xbtnbuyco2).click()
        return capacity

    def depart_all(self):
        number_to_depart = self.driver.find_element_by_xpath(self.xdepartamount).text.strip()
        while number_to_depart != "":
            save_log(get_time() + " {p} planes to depart !".format(p=number_to_depart), "blue")
            # Close popup if present
            try:
                self.driver.find_element_by_xpath(self.xbtnpopupclose).click()
            except:
                pass
            finally:
                self.driver.find_element_by_xpath(self.xbtndepart).click()
                number_to_depart = self.driver.find_element_by_xpath(self.xdepartamount).text.strip()

    def start_eco_campaign(self):
        # Eco-friendly
        self.driver.execute_script("""
        const xhttp = new XMLHttpRequest();           
        xhttp.open("GET", "marketing_new.php?type=5&mode=do&c=1", true);
        xhttp.send();
        """)

    def start_rep_campaign(self):
        # How long reputation campaign will last
        now_time = datetime.datetime.now().time()
        target_time = datetime.time(23, 59, 59)
        difference = (datetime.datetime.combine(datetime.date.today(), target_time) - datetime.datetime.combine(
            datetime.date.today(), now_time)).seconds // 60 // 60
        if 0 <= difference <= 3:
            option = 1
        elif 4 <= difference <= 7:
            option = 2
        elif 8 <= difference <= 11:
            option = 3
        elif 12 <= difference <= 15:
            option = 4
        else:
            return

        # Reputation
        call = """
        const xhttp = new XMLHttpRequest();        
        xhttp.open("GET", "marketing_new.php?type=1&c=4&mode=do&d={}", true);    
        xhttp.send();
        """
        self.driver.execute_script(call.format(option))

    def campaign_status(self):
        self.driver.find_element_by_xpath(self.xbtnfinance).click()
        sleep(0.5)
        self.driver.find_element_by_xpath(self.xbtnmarketing).click()
        sleep(0.5)
        count = 0
        try:
            self.driver.find_element_by_xpath(self.xactivecampaign).text()
            sleep(0.5)
            count = 0
        except:
            tab = self.driver.find_element_by_xpath(self.xtablecampaign)
            count = len(tab.find_elements_by_xpath("*"))
        finally:
            self.driver.find_element_by_xpath(self.xbtnpopupclose).click()
            if count == 2:
                return "good"
            else:
                return "bad"


def save_log(s, c):
    cprint(s, c)
    with open('log', 'a') as file:
        file.write(s + "\n")


def get_time():
    now = time.strftime("%Y/%m/%d %H:%M:%S", time.localtime())
    return "[{now}]".format(now=now)


def main():
    AirlineManager4Bot()


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        save_log(get_time() + " Leaving", "red")
        sys.exit(0)
