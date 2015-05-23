using Microsoft.Owin;
using Owin;

[assembly: OwinStartupAttribute(typeof(FijiProjectInventory.Startup))]
namespace FijiProjectInventory
{
    public partial class Startup
    {
        public void Configuration(IAppBuilder app)
        {
            ConfigureAuth(app);
        }
    }
}
